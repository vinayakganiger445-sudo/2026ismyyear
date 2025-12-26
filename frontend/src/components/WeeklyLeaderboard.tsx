import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/api';

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avg_points: number;
};


const WeeklyLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard/weekly`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    const data = await response.json();
    setLeaderboard(data);
  } catch (err: any) {
    setError(err.message || 'Failed to load leaderboard');
  } finally {
    setLoading(false);
  }
};


    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: 'rgba(15,23,42,0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(148,163,184,0.4)',
          minHeight: '200px',
        }}
      >
        <h3
          style={{
            color: 'white',
            fontSize: '1.1rem',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          Weekly Leaderboard
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'rgba(15,23,42,0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(148,163,184,0.4)',
        }}
      >
        <h3
          style={{
            color: 'white',
            fontSize: '1.1rem',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          Weekly Leaderboard
        </h3>
        <p style={{ color: '#f97373', fontSize: '0.85rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(148,163,184,0.4)',
      }}
    >
      <h3
        style={{
          color: 'white',
          fontSize: '1.1rem',
          marginBottom: '1rem',
          fontWeight: 600,
        }}
      >
        Weekly Leaderboard
      </h3>

      {leaderboard.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
          No quests completed last week yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.8rem',
                background: 'rgba(15,23,42,0.8)',
                borderRadius: '8px',
                border: '1px solid rgba(148,163,184,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    color: '#9ca3af',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    minWidth: '24px',
                  }}
                >
                  #{index + 1}
                </span>
                <span
                  style={{
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  {entry.display_name}
                </span>
              </div>
              <span
                style={{
                  color: '#22c55e',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {entry.avg_points}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklyLeaderboard;

