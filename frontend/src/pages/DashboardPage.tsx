import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

type Goal = {
  id?: string;
  user_id?: string;
  goal_text: string;
  streak: number;
  last_checkin?: string | null;
};

type PublicGoal = {
  id: string;
  goal_text: string;
  email?: string;
  streak: number;
  comment?: string | null;
};

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userGoal, setUserGoal] = useState<Goal | null>(null);
  const [publicGoals, setPublicGoals] = useState<PublicGoal[]>([]);
  const [goalText, setGoalText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/auth');
        return;
      }
      setUser(data.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;

    // Load user's goal
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) setUserGoal(data);
      });

    // Load public goals
    supabase
      .from('public_goals')
      .select('*')
      .limit(10)
      .then(({ data, error }) => {
        if (data && !error) setPublicGoals(data);
        setLoading(false);
      });
  }, [user]);

  const saveGoal = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        goal_text: goalText.trim(),
      })
      .select()
      .single();
    
    if (!error && data) {
      setUserGoal({ 
        id: data.id,
        user_id: data.user_id,
        goal_text: data.goal_text || goalText.trim(), 
        streak: data.streak || 0 
      });
      setGoalText('');
    } else if (error) {
      console.error('Error saving goal:', error);
    }
  };

  const checkin = async () => {
    if (!userGoal || !userGoal.id) return;
    
    const dayNumber = (userGoal.streak || 0) + 1;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Insert checkin
      const { error: checkinError } = await supabase.from('checkins').insert({
        goal_id: userGoal.id,
        day_number: dayNumber,
        checkin_date: today,
        comment: commentText.trim(),
      });
      
      if (checkinError) {
        console.error('Error inserting checkin:', checkinError);
        return;
      }
      
      // Update goal
      const { error: updateError } = await supabase
        .from('goals')
        .update({ streak: dayNumber, last_checkin: today })
        .eq('id', userGoal.id);
      
      if (updateError) {
        console.error('Error updating goal:', updateError);
        return;
      }
      
      setUserGoal({ ...userGoal, streak: dayNumber, last_checkin: today });
      setCommentText('');
    } catch (err) {
      console.error('Error in checkin:', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🚀 2026 Goal Tracker</h1>
          
          {!userGoal ? (
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
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 w-full md:w-auto"
              >
                Save My 2026 Goal
              </button>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-4">{userGoal.goal_text}</div>
              <div className="flex flex-wrap gap-4 mb-6">
                <span className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full font-bold">
                  🔥 {userGoal.streak} days
                </span>
                <span className="text-sm text-gray-500 self-center">
                  Last checkin: {userGoal.last_checkin || 'Never'}
                </span>
              </div>
              
              <div className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Day ${userGoal.streak + 1} update... What did you do today?`}
                  className="w-full p-4 border border-gray-200 rounded-xl resize-vertical h-24 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={checkin}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 w-full md:w-auto"
                >
                  ✅ Check-in Day {userGoal.streak + 1}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-2xl font-bold text-gray-900 mb-6">Everyone's Goals</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicGoals.length > 0 ? (
            publicGoals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all">
                <div className="font-bold text-xl mb-2 line-clamp-2">{goal.goal_text}</div>
                <div className="text-gray-600 mb-2">{goal.email?.split('@')[0] || 'Anonymous'}</div>
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm rounded-full font-bold">
                    🔥 {goal.streak} days
                  </span>
                </div>
                <div className="text-sm text-gray-600 min-h-[40px]">
                  {goal.comment ? goal.comment : 'No checkin today...'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 text-lg">
              No public goals yet. Be the first! 👆
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
