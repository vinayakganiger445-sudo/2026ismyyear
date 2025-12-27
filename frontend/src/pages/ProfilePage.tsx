import React, { useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import NavBar from '../components/NavBar';

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goal2026, setGoal2026] = useState('');
  const [goalPublic, setGoalPublic] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
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

        setUserId(user.id);

        // Load user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('goal_2026, goal_public, current_streak, longest_streak')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (userProfile) {
          setGoal2026(userProfile.goal_2026 || '');
          setGoalPublic(userProfile.goal_public || false);
          setCurrentStreak(userProfile.current_streak || 0);
          setLongestStreak(userProfile.longest_streak || 0);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveGoal = async () => {
    if (!userId) return;

    setSavingGoal(true);
    setMessage(null);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          goal_2026: goal2026.trim(),
          goal_public: goalPublic,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setMessage('Goal saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          goal_2026: goal2026.trim(),
          goal_public: goalPublic,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
          <p>Loading profile...</p>
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
          Profile Settings
        </h1>
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          Manage your profile and public information.
        </p>

        {/* 2026 Main Goal Section */}
        <div
          style={{
            background: 'rgba(15,23,42,0.95)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(148,163,184,0.4)',
            marginBottom: '2rem',
          }}
        >
          <h2
            style={{
              color: 'white',
              fontSize: '1.2rem',
              marginBottom: '1rem',
            }}
          >
            2026 Main Goal
          </h2>

            <label
              style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
              }}
            >
              Your main goal for 2026
            </label>
            <textarea
              value={goal2026}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setGoal2026(e.target.value);
                }
              }}
              placeholder="My main goal for 2026 is..."
              maxLength={200}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid #4b5563',
                background: 'rgba(15,23,42,0.9)',
                color: 'white',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                color: '#6b7280',
                fontSize: '0.75rem',
                marginBottom: '1rem',
                textAlign: 'right',
              }}
            >
              {goal2026.length}/200
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#e5e7eb',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              <input
                type="checkbox"
                checked={goalPublic}
                onChange={(e) => setGoalPublic(e.target.checked)}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  accentColor: '#22c55e',
                  cursor: 'pointer',
                }}
              />
              <span>Make my goal public (everyone can see it)</span>
            </label>

            {/* Preview */}
            {goalPublic && goal2026.trim() && (
              <div
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(148,163,184,0.2)',
                  marginTop: '1rem',
                }}
              >
                <div
                  style={{
                    color: '#9ca3af',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Your public profile will show:
                </div>
                <div
                  style={{
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}
                >
                  {goal2026.trim()} 🔥 {currentStreak} days
                </div>
              </div>
            )}

            {/* Save Goal Button */}
            <button
              type="button"
              onClick={handleSaveGoal}
              disabled={savingGoal}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '999px',
                border: 'none',
                background: savingGoal
                  ? '#4b5563'
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                fontWeight: 600,
                cursor: savingGoal ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                marginTop: '1rem',
              }}
            >
              {savingGoal ? 'Saving...' : 'Save goal'}
            </button>
          </div>

        <form onSubmit={handleSubmit}>
          {/* Other profile fields can go here */}
          
          {/* Submit Button */}
          <button
            type="submit"
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
              fontSize: '0.95rem',
            }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          {message && (
            <p
              style={{
                color: '#22c55e',
                fontSize: '0.85rem',
                marginTop: '0.75rem',
                textAlign: 'center',
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
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

