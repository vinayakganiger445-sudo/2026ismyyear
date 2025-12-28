import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
          console.error('Error fetching checkins:', checkinsError);
          throw new Error(`Failed to fetch checkins: ${checkinsError.message}`);
        }

        if (!rows || rows.length === 0) {
          setLeaderboard([]);
          setLoading(false);
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
        const leaderboardData: LeaderboardEntry[] = Array.from(userTotals.entries())
          .map(([userId, totalPoints]) => {
            const displayName = `User ${userId.slice(0, 6)}`;

            return {
              user_id: userId,
              display_name: displayName,
              avg_points: totalPoints, // Using total_points as avg_points for display
            };
          })
          .sort((a, b) => b.avg_points - a.avg_points) // Sort DESC by total_points
          .slice(0, 20); // Top 20

        setLeaderboard(leaderboardData);
      } catch (err: any) {
        console.error('Error loading leaderboard:', err);
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

