import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

type Goal = {
  id: string;
  user_id: string;
  goal_text: string;
  streak: number;
  last_checkin: string | null;
};

type PublicGoal = {
  id: string;
  email: string;
  goal_text: string;
  streak: number;
  comment: string | null;
};

function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userGoal, setUserGoal] = useState<Goal | null>(null);
  const [publicGoals, setPublicGoals] = useState<PublicGoal[]>([]);
  const [goalText, setGoalText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/auth');
      else setUser(data.user);
    });
  }, []);

  // 2. Load user goal + public goals
  useEffect(() => {
    if (!user) return;
    
    // User's goal
    supabase.from('goals').select('*').eq('user_id', user.id).single()
      .then(({ data, error }) => {
        if (data) setUserGoal(data);
      });

    // Public goals
    supabase.from('public_goals').select('*').limit(10)
      .then(({ data, error }) => {
        if (data) setPublicGoals(data);
        setLoading(false);
      });
  }, [user]);

  // 3. Save new goal
  const saveGoal = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id,
      goal_text: goalText
    }).select().single();
    if (!error && data) {
      setUserGoal(data);
      setGoalText('');
    }
  };

  // 4. Check-in with comment
  const checkin = async () => {
    if (!userGoal) return;
    
    const dayNumber = userGoal.streak + 1;
    const today = new Date().toISOString().split('T')[0];
    
    // Insert checkin
    await supabase.from('checkins').insert({
      goal_id: userGoal.id,
      day_number: dayNumber,
      checkin_date: today,
      comment: commentText
    });
    
    // Update goal streak
    await supabase.from('goals').update({
      streak: dayNumber,
      last_checkin: today
    }).eq('id', userGoal.id);
    
    setUserGoal({ ...userGoal, streak: dayNumber, last_checkin: today });
    setCommentText('');
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* USER SECTION */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">2026 Goal Tracker</h1>
          
          {!userGoal ? (
            // Goal form
            <div className="space-y-4">
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="My main goal for 2026 is..."
                maxLength={200}
                className="w-full p-4 border border-gray-200 rounded-xl resize-vertical h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-500">{goalText.length}/200</div>
              <button
                onClick={saveGoal}
                disabled={!goalText.trim()}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50"
              >
                Save My 2026 Goal
              </button>
            </div>
          ) : (
            // User's goal + checkin
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-4">{userGoal.goal_text}</div>
              <div className="flex gap-4 mb-6">
                <span className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full font-bold">
                  🔥 {userGoal.streak} days
                </span>
                <span className="text-sm text-gray-500">
                  Last checkin: {userGoal.last_checkin || 'Never'}
                </span>
              </div>
              
              <div className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Day ${userGoal.streak + 1} update...`}
                  className="w-full p-4 border border-gray-200 rounded-xl resize-vertical h-24 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={checkin}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700"
                >
                  Check-in Day {userGoal.streak + 1}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PUBLIC GOALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicGoals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all">
              <div className="font-bold text-xl mb-2 line-clamp-2">{goal.goal_text}</div>
              <div className="text-gray-600 mb-2">{goal.email.split('@')[0]}</div>
              <div className="flex gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm rounded-full font-bold">
                  🔥 {goal.streak} days
                </span>
              </div>
              <div className="text-sm text-gray-600 min-h-[40px]">
                {goal.comment ? goal.comment : 'No checkin today...'}
              </div>
            </div>
          ))}
        </div>

        {publicGoals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No public goals yet. Be the first! 👆
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;

