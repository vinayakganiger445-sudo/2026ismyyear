// frontend/src/pages/CheckinPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import WeeklyLeaderboard from '../components/WeeklyLeaderboard';
import { API_BASE_URL } from '../lib/api';

type GoalItem = {
  name: string;
  target: number;
  unit: string;
};

type CompletedMap = Record<string, boolean>;

const CheckinPage: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [completed, setCompleted] = useState<CompletedMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);
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
        setUserId(user.id);

        // load goals
        const { data: goalsRow, error: goalsError } = await supabase
          .from('goals')
          .select('goals')
          .eq('user_id', user.id)
          .single();

        if (goalsError) {
          throw goalsError;
        }

        const goalArray = (goalsRow?.goals || []) as GoalItem[];
        setGoals(goalArray);

        const { data: checkinRow, error: checkinError } = await supabase
          .from('checkins')
          .select('completed_goals')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (checkinError && checkinError.code !== 'PGRST116') {
          throw checkinError;
        }

        if (checkinRow?.completed_goals) {
          setCompleted(checkinRow.completed_goals as CompletedMap);
        } else {
          const initial: CompletedMap = {};
          goalArray.forEach((g) => {
            initial[g.name] = false;
          });
          setCompleted(initial);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [today]);

  const toggleGoal = (name: string) => {
    setCompleted((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const totalGoals = goals.length;
      const doneCount = goals.filter((g) => completed[g.name]).length;
      const achievedPoints =
        totalGoals === 0 ? 0 : Math.round((doneCount / totalGoals) * 100);

      const response = await fetch(`${API_BASE_URL}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, achieved_points: achievedPoints }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save check-in');
      }

      const data = await response.json();
      if (data.status === 'ok') {
        setMessage('Saved. Your points and streak are updated.');
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save check-in';
      if (errorMessage.includes('Failed to save check-in') || errorMessage.includes('Internal server error')) {
        setError('Couldn&apos;t save today&apos;s check-in. Please try again in a few seconds.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at top, #020617, #000)',
          color: 'white',
        }}
      >
        Loading your goals...
      </div>
    );
  }

  if (error && !userId) {
    return (
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
        }}
      >
        <p>{error}</p>
        <Link to="/auth" style={{ color: '#22c55e' }}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: isMobile ? '1rem' : '2rem 1rem',
        paddingTop: '5rem',
        display: 'flex',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #020617, #000)',
        overflowX: 'hidden',
      }}
    >
      <NavBar />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 320px' : '1fr',
          gap: '1.5rem',
          width: '100%',
          maxWidth: isMobile ? '100%' : isDesktop ? '1200px' : '720px',
          margin: '0 auto',
          padding: isMobile ? '0 1rem' : '0',
        }}
      >
        <div
          style={{
            background: 'rgba(15,23,42,0.95)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1rem' : '24px',
            border: '1px solid rgba(148,163,184,0.4)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
            width: '100%',
            maxWidth: isMobile ? '100%' : '28rem',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
        <h1 style={{ 
          color: 'white', 
          fontSize: isMobile ? '1.25rem' : '1.6rem', 
          marginBottom: '0.25rem',
          wordWrap: 'break-word',
        }}>
          Today&apos;s check-in
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Date: {today}
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Tick only what you truly did today. Your weekly score and streak depend on your honesty.
        </p>

        {goals.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>
            You have no goals yet. Set them first on the{' '}
            <Link to="/goals" style={{ color: '#22c55e' }}>
              Goals page
            </Link>
            .
          </p>
        ) : (
          <>
            {goals.map((g) => (
              <label
                key={g.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  marginBottom: '0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(15,23,42,0.9)',
                  border: '1px solid #4b5563',
                  color: 'white',
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                  <div style={{ fontWeight: 500, wordWrap: 'break-word' }}>{g.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', wordWrap: 'break-word' }}>
                    Target: {g.target} {g.unit}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!!completed[g.name]}
                  onChange={() => toggleGoal(g.name)}
                  style={{
                    flexShrink: 0,
                    width: '1.25rem',
                    height: '1.25rem',
                  }}
                />
              </label>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '999px',
                border: 'none',
                background: saving
                  ? '#4b5563'
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                boxSizing: 'border-box',
              }}
            >
              {saving ? 'Saving...' : 'Save today&apos;s check-in'}
            </button>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}>
              You can edit this later today, but tomorrow is a new day.
            </p>
          </>
        )}

        {message && (
          <p
            style={{
              color: '#22c55e',
              fontSize: '0.85rem',
              marginTop: '0.75rem',
            }}
          >
            {message}
          </p>
        )}
        {error && (
          <p
            style={{
              color: '#f97373',
              fontSize: '0.85rem',
              marginTop: '0.75rem',
            }}
          >
            {error}
          </p>
        )}
        </div>
        
        {/* Weekly Leaderboard - Desktop only */}
        {isDesktop && (
          <div>
            <WeeklyLeaderboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinPage;
