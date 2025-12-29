import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type LeaderboardEntry = {
  user_id: string;
  email: string;
  primary_focus: string | null;
  checkin_count: number;
};

const WeeklyLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWeekStartAndEnd = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return {
      weekStart: monday.toISOString(),
      weekEnd: sunday.toISOString(),
    };
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const { weekStart, weekEnd } = getWeekStartAndEnd();

      // First, get checkins for this week
      const weekStartDate = new Date(weekStart).toISOString().split('T')[0];
      const weekEndDate = new Date(weekEnd).toISOString().split('T')[0];

      const { data: checkins, error: fetchError } = await supabase
        .from('checkins')
        .select('user_id, date')
        .gte('date', weekStartDate)
        .lte('date', weekEndDate);

      if (fetchError) {
        console.error('Error fetching checkins:', fetchError);
        throw new Error(`Could not load leaderboard: ${fetchError.message}`);
      }

      if (!checkins || checkins.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(checkins.map((c: any) => c.user_id))];

      // Fetch user emails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, primary_focus')
        .in('id', userIds);

      if (fetchError) {
        console.error('Error fetching leaderboard:', fetchError);
        throw new Error(`Could not load leaderboard: ${fetchError.message}`);
      }

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw new Error(`Could not load leaderboard: ${usersError.message}`);
      }

      // Create user map
      const userMap = new Map<string, { email: string; primary_focus: string | null }>();
      users?.forEach((user: any) => {
        userMap.set(user.id, { email: user.email || '', primary_focus: user.primary_focus });
      });

      // Group by user_id and count checkins
      const userCheckinCounts = new Map<string, { email: string; primary_focus: string | null; count: number }>();
      
      checkins.forEach((checkin: any) => {
        const userId = checkin.user_id;
        const userInfo = userMap.get(userId) || { email: '', primary_focus: null };
        
        if (!userCheckinCounts.has(userId)) {
          userCheckinCounts.set(userId, { 
            email: userInfo.email, 
            primary_focus: userInfo.primary_focus, 
            count: 0 
          });
        }
        
        const userData = userCheckinCounts.get(userId)!;
        userData.count += 1;
      });

      // Convert to array and sort by count DESC
      const leaderboardData: LeaderboardEntry[] = Array.from(userCheckinCounts.entries())
        .map(([userId, data]) => ({
          user_id: userId,
          email: data.email,
          primary_focus: data.primary_focus,
          checkin_count: data.count,
        }))
        .sort((a, b) => b.checkin_count - a.checkin_count)
        .slice(0, 10); // Top 10

      setLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
      setError(err.message || 'Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  if (loading) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-700">
        <h3 className="text-white text-lg font-semibold mb-4">Weekly Leaderboard</h3>
        <p className="text-gray-400 text-sm">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Weekly Leaderboard</h3>
          <button
            onClick={fetchLeaderboard}
            className="px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700 text-gray-300"
          >
            Refresh
          </button>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-semibold">Weekly Leaderboard</h3>
        <button
          onClick={fetchLeaderboard}
          className="px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700 text-gray-300"
        >
          Refresh
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-gray-400 text-sm">No checkins this week yet!</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const medal = getMedal(rank);
            return (
              <div
                key={entry.user_id}
                className="flex items-center justify-between p-3 bg-slate-800 dark:bg-slate-700 rounded-lg border border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-semibold min-w-[2rem]">
                    #{rank} {medal}
                  </span>
                  <span className="text-white text-sm font-medium">
                    {entry.email}
                  </span>
                </div>
                <span className="text-green-400 text-sm font-semibold">
                  {entry.checkin_count} checkins this week
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklyLeaderboard;
