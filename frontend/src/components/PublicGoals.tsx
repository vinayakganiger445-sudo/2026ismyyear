import React, { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

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
  const [gridCols, setGridCols] = useState('1fr');

  useEffect(() => {
    const updateGrid = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setGridCols('repeat(3, 1fr)'); // desktop
      } else if (width >= 768) {
        setGridCols('repeat(2, 1fr)'); // tablet
      } else {
        setGridCols('repeat(1, 1fr)'); // mobile
      }
    };

    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, []);

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
      setError(err.message || 'Failed to load public goals');
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
    return (
      <div
        style={{
          background: 'rgba(15,23,42,0.95)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(148,163,184,0.4)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2
            style={{
              color: 'white',
              fontSize: '1.2rem',
              margin: 0,
            }}
          >
            Public Goals
          </h2>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'rgba(15,23,42,0.95)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(148,163,184,0.4)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2
            style={{
              color: 'white',
              fontSize: '1.2rem',
              margin: 0,
            }}
          >
            Public Goals
          </h2>
          <button
            onClick={fetchGoals}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.4)',
              background: 'transparent',
              color: '#e5e7eb',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
        <p style={{ color: '#f97373', fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(148,163,184,0.4)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2
          style={{
            color: 'white',
            fontSize: '1.2rem',
            margin: 0,
          }}
        >
          Public Goals
        </h2>
        <button
          onClick={fetchGoals}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(148,163,184,0.4)',
            background: 'transparent',
            color: '#e5e7eb',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {goals.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          No public goals yet. Be the first to make yours public.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: '1rem',
          }}
        >
          {goals.map((goal) => (
            <div
              key={goal.id}
              style={{
                background: 'rgba(15,23,42,0.8)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(148,163,184,0.2)',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  {getEmailPrefix(goal.email)}
                </div>
                {goal.primary_focus && (
                  <div style={{ color: '#6b7280', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                    {goal.primary_focus}
                  </div>
                )}
              </div>

              {goal.goal_2026 && (
                <div
                  style={{
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 500,
                    marginBottom: '0.75rem',
                    lineHeight: '1.4',
                  }}
                >
                  {goal.goal_2026}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {goal.current_streak !== null && goal.current_streak > 0 && (
                  <span
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: '#22c55e',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}
                  >
                    🔥 {goal.current_streak} days
                  </span>
                )}
                {goal.longest_streak !== null && goal.longest_streak > 0 && (
                  <span
                    style={{
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(251,191,36,0.3)',
                    }}
                  >
                    🏆 {goal.longest_streak} days
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicGoals;

