import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import NavBar from '../components/NavBar';
import { isLastDayOfMonth } from '../lib/dateUtils';
import { API_BASE_URL } from '../lib/api';

const todayIsLastDay = isLastDayOfMonth(new Date());

const primaryFocusOptions = [
  'No Porn',
  'Fitness / Gym',
  'Reading',
  'Meditation',
  'Career / Skills',
  'Money / Finance',
  'Relationships',
  'Other',
];

const AuthPage: React.FC = () => {
  const [isLastDay, setIsLastDay] = useState(true);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrimaryFocus, setShowPrimaryFocus] = useState(false);
  const [primaryFocus, setPrimaryFocus] = useState('');
  const [registeringIntent, setRegisteringIntent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    setIsLastDay(isLastDayOfMonth(today));
    // TEMP: allow signup any day for development
    // If not last day, default to signin mode
    // if (!isLastDayOfMonth(today)) {
    //   setMode('signin');
    // }
  }, []);


  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === 'signup') {
        // Sign up new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Show primary focus selection step
          setShowPrimaryFocus(true);
          setMessage('Account created! Now select your primary focus.');
        } else {
          throw new Error('Failed to create account');
        }
      } else {
        // Sign in existing user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        setMessage('Signed in successfully.');
        navigate('/goals');
      }
    } catch (err: any) {
      setError(err.message || 'Auth error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterIntent = async () => {
    if (!primaryFocus) {
      setError('Please select a primary focus');
      return;
    }

    setRegisteringIntent(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      const response = await fetch(`${API_BASE_URL}/api/register-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          primary_focus: primaryFocus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register intent');
      }

      const result = await response.json();
      
      if (result.partnerMatched) {
        setMessage(`Account created! You've been matched with a partner.`);
      } else {
        setMessage('Account created! You will be matched with a partner when one becomes available.');
      }

      // Navigate to goals page after a short delay
      setTimeout(() => {
        navigate('/goals');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register intent');
    } finally {
      setRegisteringIntent(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #111827, #020617)',
        paddingTop: '4rem',
      }}
    >
      <NavBar />
      <div
        style={{
          background: 'rgba(15,23,42,0.9)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(148,163,184,0.4)',
        }}
      >
        <h1 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          {showPrimaryFocus 
            ? 'Select Your Primary Focus' 
            : mode === 'signup' 
            ? 'Create your 2026 account' 
            : 'Sign in to 2026'}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {showPrimaryFocus 
            ? 'Choose the main goal you want to focus on. This helps us match you with an accountability partner.'
            : 'Use email + password for now. Later we can switch to magic links once SMTP is set.'}
        </p>
        {/* TEMP: allow signup any day for development */}
        {/* {!todayIsLastDay && mode === 'signup' && (
          <p style={{ color: '#f97373', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            New registrations open only on the last day of each month.
            You can still sign in if you already joined.
          </p>
        )} */}

        {/* TEMP: allow signup any day for development */}
        {/* {!isLastDay && mode === 'signup' && (
          <div
            style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <p style={{ color: '#fb923c', fontSize: '0.85rem', margin: 0 }}>
              New registrations open only on the last day of each month. You can still sign in if you already joined.
            </p>
          </div>
        )} */}

        {showPrimaryFocus ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              {primaryFocusOptions.map((option) => (
                <label
                  key={option}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: 'rgba(15,23,42,0.8)',
                    borderRadius: '8px',
                    border: `1px solid ${primaryFocus === option ? '#22c55e' : '#4b5563'}`,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="primaryFocus"
                    value={option}
                    checked={primaryFocus === option}
                    onChange={(e) => setPrimaryFocus(e.target.value)}
                    style={{
                      marginRight: '0.75rem',
                      accentColor: '#22c55e',
                    }}
                  />
                  <span style={{ color: 'white' }}>{option}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleRegisterIntent}
              disabled={registeringIntent || !primaryFocus}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: '999px',
                border: 'none',
                cursor: registeringIntent || !primaryFocus ? 'not-allowed' : 'pointer',
                background:
                  registeringIntent || !primaryFocus
                    ? '#4b5563'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              {registeringIntent ? 'Registering...' : 'Continue'}
            </button>
          </>
        ) : (
          <>

        <label style={{ display: 'block', color: '#e5e7eb', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #4b5563',
            background: 'rgba(15,23,42,0.8)',
            color: 'white',
            marginBottom: '0.75rem',
          }}
        />

        <label style={{ display: 'block', color: '#e5e7eb', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #4b5563',
            background: 'rgba(15,23,42,0.8)',
            color: 'white',
            marginBottom: '1rem',
          }}
        />

            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                !email ||
                !password
                // TEMP: allow signup any day for development
                // (mode === 'signup' && !todayIsLastDay)
              }
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: '999px',
                border: 'none',
                cursor:
                  loading || !email || !password
                    // TEMP: allow signup any day for development
                    // || (mode === 'signup' && !todayIsLastDay)
                    ? 'not-allowed'
                    : 'pointer',
                background:
                  loading || !email || !password
                    // TEMP: allow signup any day for development
                    // || (mode === 'signup' && !todayIsLastDay)
                    ? '#4b5563'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>


            <button
              type="button"
              onClick={() => {
                // TEMP: allow signup any day for development
                setMode(mode === 'signup' ? 'signin' : 'signup');
                // if (isLastDay) {
                //   setMode(mode === 'signup' ? 'signin' : 'signup');
                // } else {
                //   // If not last day, only allow switching to signin
                //   setMode('signin');
                // }
              }}
              // TEMP: allow signup any day for development
              // disabled={!isLastDay && mode === 'signup'}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '999px',
                border: '1px solid #4b5563',
                background: 'transparent',
                // TEMP: allow signup any day for development
                color: '#e5e7eb',
                // color: !isLastDay && mode === 'signup' ? '#6b7280' : '#e5e7eb',
                fontSize: '0.8rem',
                marginBottom: '0.5rem',
                // TEMP: allow signup any day for development
                cursor: 'pointer',
                // cursor: !isLastDay && mode === 'signup' ? 'not-allowed' : 'pointer',
                // TEMP: allow signup any day for development
                opacity: 1,
                // opacity: !isLastDay && mode === 'signup' ? 0.5 : 1,
              }}
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
              {/* TEMP: allow signup any day for development */}
              {/* : isLastDay
                ? "Don't have an account? Sign up"
                : "New signups only on last day of month"} */}
            </button>
          </>
        )}

        {message && (
          <p style={{ color: '#22c55e', fontSize: '0.8rem' }}>{message}</p>
        )}
        {error && (
          <p style={{ color: '#f97373', fontSize: '0.8rem' }}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
