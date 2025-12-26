import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import NavBar from '../components/NavBar';

type GoalItem = {
  name: string;
  target: number;
  unit: string;
};

type CheckinRow = {
  date: string;
  achieved_points: number;
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [averageCompletion, setAverageCompletion] = useState(0);
  const [latestPoints, setLatestPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setError('Not logged in. Please sign in first.');
          setLoading(false);
          return;
        }

        // Fetch checkins
        const { data: checkinsData, error: checkinsError } = await supabase
          .from('checkins')
          .select('date, achieved_points')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (checkinsError) throw checkinsError;

        const checkins = (checkinsData || []) as CheckinRow[];

        // Calculate stats
        const total = checkins.length;
        setTotalCheckins(total);

        if (total > 0) {
          const sum = checkins.reduce((acc, c) => acc + (c.achieved_points || 0), 0);
          const avg = Math.round(sum / total);
          setAverageCompletion(avg);
          setLatestPoints(checkins[0]?.achieved_points || null);
        } else {
          setAverageCompletion(0);
          setLatestPoints(null);
        }

        // Calculate streak (most recent consecutive days with achieved_points > 0)
        let currentStreak = 0;
        if (checkins.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Sort checkins by date descending (most recent first)
          const sortedCheckins = [...checkins].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          // Create a map of date -> achieved_points for quick lookup
          const checkinMap = new Map<string, number>();
          sortedCheckins.forEach(c => {
            checkinMap.set(c.date, c.achieved_points || 0);
          });
          
          // Start from today and go backwards
          let currentDate = new Date(today);
          let consecutiveDays = 0;
          
          // Check up to 365 days back
          for (let i = 0; i < 365; i++) {
            const dateStr = currentDate.toISOString().slice(0, 10);
            const points = checkinMap.get(dateStr);
            
            if (points !== undefined && points > 0) {
              consecutiveDays++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              // If we've started counting and hit a day without points, break
              if (consecutiveDays > 0) {
                break;
              }
              // If we haven't started counting, keep going back
              currentDate.setDate(currentDate.getDate() - 1);
            }
          }
          
          currentStreak = consecutiveDays;
        }
        setStreak(currentStreak);

        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('goals')
          .eq('user_id', user.id)
          .single();

        if (goalsError && goalsError.code !== 'PGRST116') {
          throw goalsError;
        }

        if (goalsData?.goals) {
          setGoals(goalsData.goals as GoalItem[]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <>
        <NavBar />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top, #020617, #000)',
            color: 'white',
            paddingTop: '4rem',
          }}
        >
          <p>Loading dashboard...</p>
        </div>
      </>
    );
  }

  if (error && !totalCheckins && !goals.length) {
    return (
      <>
        <NavBar />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top, #020617, #000)',
            color: 'white',
            flexDirection: 'column',
            gap: '1rem',
            paddingTop: '4rem',
          }}
        >
          <p>{error}</p>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 1rem',
        paddingTop: '5rem',
        display: 'flex',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #020617, #000)',
      }}
    >
      <NavBar />
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: 'rgba(15,23,42,0.95)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(148,163,184,0.4)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: '1.75rem',
            marginBottom: '0.5rem',
          }}
        >
          Your Dashboard
        </h1>
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          Track your progress and stay accountable.
        </p>

        {/* Stats Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: 'rgba(15,23,42,0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Total check-ins
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
              {totalCheckins}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15,23,42,0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Average completion
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
              {averageCompletion}%
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15,23,42,0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Streak estimate
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
              {streak} {streak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {latestPoints !== null && (
          <div
            style={{
              background: 'rgba(15,23,42,0.8)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Latest check-in
            </div>
            <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>
              {latestPoints}% completed
            </div>
          </div>
        )}

        {/* Goals Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              color: 'white',
              fontSize: '1.2rem',
              marginBottom: '1rem',
            }}
          >
            Your Goals
          </h2>
          {goals.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              No goals set yet. Set your goals to start tracking.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {goals.map((goal, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    borderRadius: '12px',
                    padding: '0.8rem',
                    border: '1px solid rgba(148,163,184,0.2)',
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 500, marginBottom: '0.25rem' }}>
                    {goal.name}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                    Target: {goal.target} {goal.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate('/goals')}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '0.8rem',
              borderRadius: '999px',
              border: '1px solid rgba(148,163,184,0.4)',
              background: 'transparent',
              color: '#e5e7eb',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Manage Goals
          </button>
          <button
            onClick={() => navigate('/checkin')}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '0.8rem',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Today&apos;s Check-in
          </button>
        </div>

        {error && (
          <p
            style={{
              color: '#f97373',
              fontSize: '0.85rem',
              marginTop: '1rem',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

