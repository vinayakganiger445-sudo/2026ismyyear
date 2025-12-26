import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { isLastDayOfMonth, getCurrentMonthString, findPartnerForUser } from './partnerMatching';
import { supabase } from './supabaseClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration to allow requests from Vercel frontend and localhost
app.use(
  cors({
    origin: [
      'https://2026ismyyear-navy.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/leaderboard/weekly', async (req, res) => {
  try {
    // Calculate date range for last 7 days (including today)
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 6 days back + today = 7 days total
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch all checkins in the date range
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('user_id, achieved_points, date')
      .gte('date', startDate)
      .lte('date', endDate);

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError);
      return res.status(500).json({
        error: 'Failed to fetch checkins',
        details: checkinsError.message,
      });
    }

    if (!checkins || checkins.length === 0) {
      return res.json([]);
    }

    // Group by user_id and calculate total points
    const userStats = new Map<string, number>();
    
    checkins.forEach((checkin: any) => {
      const userId = checkin.user_id;
      const points = checkin.achieved_points || 0;
      
      if (!userStats.has(userId)) {
        userStats.set(userId, 0);
      }
      
      userStats.set(userId, userStats.get(userId)! + points);
    });

    // Get user IDs
    const userIds = Array.from(userStats.keys());
    
    // Fetch users to get display_name or email
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({
        error: 'Failed to fetch users',
        details: usersError.message,
      });
    }

    // Create a map of user_id -> name
    const userNameMap = new Map<string, string>();
    users?.forEach((user: any) => {
      let name = user.display_name;
      if (!name) {
        // Try to use email (anonymized) or fallback to User ID
        if (user.email && user.email.length >= 3) {
          const firstThree = user.email.substring(0, 3);
          name = `${firstThree}***`;
        } else {
          name = `User ${user.id.substring(0, 8)}`;
        }
      }
      userNameMap.set(user.id, name);
    });

    // Build leaderboard entries
    const leaderboard = Array.from(userStats.entries())
      .map(([userId, totalPoints]) => {
        const name = userNameMap.get(userId) || `User ${userId.substring(0, 8)}`;

        return {
          user_id: userId,
          name: name,
          total_points: totalPoints,
        };
      })
      .sort((a, b) => b.total_points - a.total_points) // Sort DESC by total_points
      .slice(0, 20); // Top 20

    return res.json(leaderboard);
  } catch (error: any) {
    console.error('Error in leaderboard/weekly endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

app.post('/api/register-intent', async (req, res) => {
  try {
    const { user_id, primary_focus } = req.body;

    if (!user_id || !primary_focus) {
      return res.status(400).json({
        error: 'Missing required fields: user_id and primary_focus are required',
      });
    }

    const today = new Date();

    // TEMP: allow registration any day for development
// if (!isLastDayOfMonth(today)) {
//   return res.status(403).json({
//     error: 'Registration only allowed on last day of month.',
//   });
// }


    const currentMonth = getCurrentMonthString(today);

    // Update user row with primary_focus, joined_month, and is_new_user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        primary_focus: primary_focus,
        joined_month: currentMonth,
        is_new_user: false,
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({
        error: 'Failed to update user',
        details: updateError.message,
      });
    }

    // Try to find a partner
    let partnerMatched = false;
    let partner = null;

    try {
      partner = await findPartnerForUser(supabase, user_id, primary_focus);
      partnerMatched = partner !== null;
    } catch (matchError: any) {
      console.error('Error finding partner:', matchError);
      // Continue even if matching fails - user is still registered
    }

    // Return success response
    const response: any = {
      status: 'ok',
      partnerMatched: partnerMatched,
    };

    if (partnerMatched && partner) {
      response.partner = {
        id: partner.id,
        primary_focus: partner.primary_focus,
        joined_month: partner.joined_month,
      };
    }

    return res.json(response);
  } catch (error: any) {
    console.error('Error in register-intent endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});
app.post('/api/checkin', async (req, res) => {
  try {
    console.log('Incoming /api/checkin body:', req.body);
    const { user_id, achieved_points, date } = req.body;
    if (!user_id || achieved_points === undefined) {
      return res.status(400).json({ error: 'Missing user_id or achieved_points' });
    }

    const effectiveDate = date || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('checkins')
      .upsert(
        {
          user_id,
          date: effectiveDate,
          achieved_points,
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase error in /api/checkin:', error);
      return res.status(500).json({
        error: 'Supabase upsert failed',
        details: error.message,
        code: error.code,
      });
    }

    return res.json({ status: 'ok', checkin: data });
  } catch (err: any) {
    console.error('Unhandled error in /api/checkin:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


