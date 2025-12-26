export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export type WeeklyEntry = {
  user_id: string;
  name: string;
  total_points: number;
};

export async function fetchWeeklyLeaderboard() {
  const res = await fetch(`${API_BASE_URL}/api/leaderboard/weekly`);
  if (!res.ok) throw new Error('Failed to load leaderboard');
  return res.json() as Promise<WeeklyEntry[]>;
}
