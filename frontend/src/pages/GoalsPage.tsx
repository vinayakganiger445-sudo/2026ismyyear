import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import NavBar from '../components/NavBar';
import WeeklyLeaderboard from '../components/WeeklyLeaderboard';

type GoalItem = {
  name: string;
  target: number;
  unit: string; // e.g. "days/week", "times/week", "minutes/day"
};

const defaultSuggestions: GoalItem[] = [
  { name: 'No Porn', target: 7, unit: 'days/week' },
  { name: 'Gym / Workout', target: 3, unit: 'days/week' },
  { name: 'Read', target: 20, unit: 'minutes/day' },
  { name: 'Meditation', target: 10, unit: 'minutes/day' },
];

const GoalsPage: React.FC = () => {
  const [primaryFocus, setPrimaryFocus] = useState<string>('quit_porn');
  const [goals, setGoals] = useState<GoalItem[]>(defaultSuggestions);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateGoal = (index: number, key: keyof GoalItem, value: string) => {
    const updated = [...goals];
    if (key === 'target') {
      updated[index][key] = Number(value) || 0;
    } else {
      updated[index][key] = value;
    }
    setGoals(updated);
  };

  const addGoal = () => {
    setGoals([
      ...goals,
      { name: '', target: 1, unit: 'times/week' },
    ]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const saveGoals = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not logged in');

      const cleanGoals = goals.filter(
        (g) => g.name.trim() && g.target > 0
      );

      // Save goals in Supabase
      const { error: upsertError } = await supabase
        .from('goals')
        .upsert(
          {
            user_id: user.id,
            goals: cleanGoals,
          },
          { onConflict: 'user_id' }
        );
      if (upsertError) throw upsertError;

      setMessage('Goals saved. You&apos;re locked in for 2026.');
    } catch (err: any) {
      setError(err.message || 'Failed to save goals');
    } finally {
      setLoading(false);
    }
  };

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
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 320px' : '1fr',
          gap: '1.5rem',
          width: '100%',
          maxWidth: isDesktop ? '1200px' : '720px',
        }}
      >
        <div
          style={{
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
            Set your 2026 goals
          </h1>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}
          >
            These are your targets for the whole year. You can change them later, but the point is to commit.
          </p>
          <h2 style={{ color: 'white', fontSize: '1.1rem', marginTop: '0.75rem' }}>
            Your main focus for 2026
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            This is used to match you with a 1–1 accountability partner.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { id: 'quit_porn', label: 'Quit porn & addictions' },
              { id: 'business', label: 'Business & career' },
              { id: 'fitness', label: 'Fitness & health' },
              { id: 'mindset', label: 'Mindset & mental health' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPrimaryFocus(opt.id)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  border:
                    primaryFocus === opt.id
                      ? '1px solid #22c55e'
                      : '1px solid #4b5563',
                  background:
                    primaryFocus === opt.id
                      ? 'rgba(34,197,94,0.15)'
                      : 'transparent',
                  color: 'white',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {goals.map((goal, index) => (
            <div
              key={index}
              style={{
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.2fr auto',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}
              >
              <input
                type="text"
                placeholder="Goal name (e.g. No Porn)"
                value={goal.name}
                onChange={(e) =>
                  updateGoal(index, 'name', e.target.value)
                }
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: 'rgba(15,23,42,0.9)',
                  color: 'white',
                }}
              />
              <input
                type="number"
                min={1}
                value={goal.target}
                onChange={(e) =>
                  updateGoal(index, 'target', e.target.value)
                }
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: 'rgba(15,23,42,0.9)',
                  color: 'white',
                }}
              />
              <select
                value={goal.unit}
                onChange={(e) =>
                  updateGoal(index, 'unit', e.target.value)
                }
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  background: 'rgba(15,23,42,0.9)',
                  color: 'white',
                }}
              >
                <option value="days/week">days/week</option>
                <option value="times/week">times/week</option>
                <option value="minutes/day">minutes/day</option>
                <option value="hours/day">hours/day</option>
              </select>
              <button
                type="button"
                onClick={() => removeGoal(index)}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '50%',
                  border: '1px solid #4b5563',
                  background: 'transparent',
                  color: '#9ca3af',
                  cursor: 'pointer',
                }}
                >
                  ✕
                </button>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.25rem', marginLeft: '0.5rem' }}>
                Target: {goal.target} {goal.unit}. Aim for a number that is ambitious but realistic.
              </p>
            </div>
          ))}

          <button
            type="button"
            onClick={addGoal}
            style={{
              marginTop: '0.5rem',
              marginBottom: '1rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '999px',
              border: '1px dashed #4b5563',
              background: 'transparent',
              color: '#e5e7eb',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            + Add another goal
          </button>

          <button
            onClick={saveGoals}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '999px',
              border: 'none',
              background: loading
                ? '#4b5563'
                : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save goals for 2026'}
          </button>

          {message && (
            <>
              <p style={{ color: '#22c55e', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                {message}
              </p>
              <button
                onClick={() => navigate('/checkin')}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'transparent',
                  color: '#e5e7eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.75rem',
                }}
              >
                Go to today's check-in
              </button>
            </>
          )}
          {error && (
            <p style={{ color: '#f97373', fontSize: '0.85rem', marginTop: '0.75rem' }}>
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

export default GoalsPage;
