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

type PublicGoal = {
  id: string;
  email: string;
  primary_focus: string | null;
  goal_2026: string | null;
  current_streak: number | null;
  longest_streak: number | null;
  created_at: string;
};

const PublicGoals: React.FC = () => {
  const [goals, setGoals] = useState<PublicGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('public_goals')
        .select('id, email, primary_focus, goal_2026, current_streak, longest_streak, created_at')
        .limit(20);

      if (fetchError) throw fetchError;

      setGoals(data || []);
    } catch (err: any) {
      setError(err.message || 'Could not load public goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const getEmailPrefix = (email: string) => {
    return email.split('@')[0];
  };

  if (loading) {
    return <p className="text-gray-400">Loading public goals…</p>;
  }

  if (error) {
    return (
      <div>
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchGoals}
          className="mt-2 px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (goals.length === 0) {
    return <p className="text-gray-400">No public goals yet. Be the first to make yours public.</p>;
  }

  return (
    <div>
      <button
        onClick={fetchGoals}
        className="mb-4 px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-700 text-gray-300"
      >
        Refresh
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-4"
          >
            <div className="font-bold text-gray-900 dark:text-white mb-1">
              {getEmailPrefix(goal.email)}
            </div>
            {goal.primary_focus && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {goal.primary_focus}
              </div>
            )}
            {goal.goal_2026 && (
              <div className="text-base text-gray-900 dark:text-white mb-3">
                {goal.goal_2026}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {goal.current_streak !== null && goal.current_streak > 0 && (
                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
                  🔥 {goal.current_streak} days
                </span>
              )}
              {goal.longest_streak !== null && goal.longest_streak > 0 && (
                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                  🏆 {goal.longest_streak} days
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [averageCompletion, setAverageCompletion] = useState(0);
  const [latestPoints, setLatestPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ user_id: string; name: string; total_points: number }>>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
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

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      try {
        // Calculate date range for last 7 days (including today)
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // 6 days back + today = 7 days total
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        // Fetch all checkins in the date range
        const { data: rows, error: checkinsError } = await supabase
          .from('checkins')
          .select('user_id, achieved_points, date')
          .gte('date', sevenDaysAgoStr)
          .lte('date', todayStr)
          .order('user_id', { ascending: true });

        if (checkinsError) {
          console.error('Error fetching checkins for leaderboard:', checkinsError);
          throw new Error(`Failed to fetch checkins: ${checkinsError.message}`);
        }

        if (!rows || rows.length === 0) {
          setLeaderboard([]);
          return;
        }

        // Aggregate total points per user_id
        const userTotals = new Map<string, number>();
        
        rows.forEach((row: any) => {
          const userId = row.user_id;
          const points = row.achieved_points || 0;
          
          if (!userTotals.has(userId)) {
            userTotals.set(userId, 0);
          }
          
          userTotals.set(userId, userTotals.get(userId)! + points);
        });

        // Build leaderboard entries with synthetic names
        const leaderboardData = Array.from(userTotals.entries())
          .map(([userId, totalPoints]) => {
            const name = `User ${userId.slice(0, 6)}`;

            return {
              user_id: userId,
              name: name,
              total_points: totalPoints,
            };
          })
          .sort((a, b) => b.total_points - a.total_points) // Sort DESC by total_points
          .slice(0, 20); // Top 20

        setLeaderboard(leaderboardData);
      } catch (err: any) {
        console.error('Error loading leaderboard:', err);
        setLeaderboardError(err.message || 'Failed to load leaderboard');
      } finally {
        setLeaderboardLoading(false);
      }
    };
    loadLeaderboard();
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
          Your 2026 pledge
        </h1>
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          See your current streak, total points, and how you rank this week.
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
              Honesty streak
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
              {streak} {streak === 1 ? 'day' : 'days'}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.25rem' }}>
              Days in a row you&apos;ve checked in.
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
              Total points
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
              {totalCheckins > 0 ? Math.round((averageCompletion * totalCheckins) / 100) : 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.25rem' }}>
              Higher points = more consistent weeks.
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

        {/* Weekly Leaderboard Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              color: 'white',
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
            }}
          >
            Weekly leaderboard
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Top users by total points over the last 7 days.
          </p>
          {leaderboardLoading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Loading leaderboard...</p>
          ) : leaderboardError ? (
            <p style={{ color: '#f97373', fontSize: '0.9rem' }}>We couldn&apos;t load the leaderboard. Refresh to try again.</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No check-ins yet. Once people start checking in, rankings will appear here.</p>
          ) : (
            <div
              style={{
                background: 'rgba(15,23,42,0.8)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(148,163,184,0.2)',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        color: '#9ca3af',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        padding: '0.5rem',
                        borderBottom: '1px solid rgba(148,163,184,0.2)',
                      }}
                    >
                      Rank
                    </th>
                    <th
                      style={{
                        color: '#9ca3af',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        padding: '0.5rem',
                        borderBottom: '1px solid rgba(148,163,184,0.2)',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        color: '#9ca3af',
                        fontSize: '0.85rem',
                        textAlign: 'right',
                        padding: '0.5rem',
                        borderBottom: '1px solid rgba(148,163,184,0.2)',
                      }}
                    >
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user_id}>
                      <td
                        style={{
                          color: 'white',
                          fontSize: '0.9rem',
                          padding: '0.5rem',
                          borderBottom: '1px solid rgba(148,163,184,0.1)',
                        }}
                      >
                        #{index + 1}
                      </td>
                      <td
                        style={{
                          color: 'white',
                          fontSize: '0.9rem',
                          padding: '0.5rem',
                          borderBottom: '1px solid rgba(148,163,184,0.1)',
                        }}
                      >
                        {entry.name}
                      </td>
                      <td
                        style={{
                          color: '#22c55e',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textAlign: 'right',
                          padding: '0.5rem',
                          borderBottom: '1px solid rgba(148,163,184,0.1)',
                        }}
                      >
                        {entry.total_points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Public 2026 Goals Section */}
      <div style={{ marginTop: '2rem', width: '100%', maxWidth: '720px' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '1.2rem',
            marginBottom: '1rem',
          }}
        >
          Public 2026 Goals
        </h2>
        <PublicGoals />
      </div>
    </div>
  );
};

export default DashboardPage;

