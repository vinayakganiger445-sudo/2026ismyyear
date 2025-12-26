"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const partnerMatching_1 = require("./partnerMatching");
const supabaseClient_1 = require("./supabaseClient");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Habit commitment API is running' });
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
        const { data: checkins, error: checkinsError } = await supabaseClient_1.supabase
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
        // Group by user_id and calculate average
        const userStats = new Map();
        checkins.forEach((checkin) => {
            const userId = checkin.user_id;
            const points = checkin.achieved_points || 0;
            if (!userStats.has(userId)) {
                userStats.set(userId, { total: 0, count: 0 });
            }
            const stats = userStats.get(userId);
            stats.total += points;
            stats.count += 1;
        });
        // Calculate averages and get user IDs
        const userIds = Array.from(userStats.keys());
        // Fetch user emails
        const { data: users, error: usersError } = await supabaseClient_1.supabase
            .from('users')
            .select('id, email')
            .in('id', userIds);
        if (usersError) {
            console.error('Error fetching users:', usersError);
            return res.status(500).json({
                error: 'Failed to fetch users',
                details: usersError.message,
            });
        }
        // Create a map of user_id -> email
        const userEmailMap = new Map();
        users?.forEach((user) => {
            userEmailMap.set(user.id, user.email || '');
        });
        // Build leaderboard entries
        const leaderboard = Array.from(userStats.entries())
            .map(([userId, stats]) => {
            const avgPoints = Math.round(stats.total / stats.count);
            const email = userEmailMap.get(userId) || '';
            // Anonymize email: first 3 letters + '***'
            let displayName = 'Anonymous';
            if (email && email.length >= 3) {
                const firstThree = email.substring(0, 3);
                displayName = `${firstThree}***`;
            }
            else if (email) {
                displayName = `${email.substring(0, email.length)}***`;
            }
            return {
                user_id: userId,
                display_name: displayName,
                avg_points: avgPoints,
            };
        })
            .sort((a, b) => b.avg_points - a.avg_points) // Sort DESC by avg_points
            .slice(0, 10); // Top 10
        return res.json(leaderboard);
    }
    catch (error) {
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
        const currentMonth = (0, partnerMatching_1.getCurrentMonthString)(today);
        // Update user row with primary_focus, joined_month, and is_new_user
        const { error: updateError } = await supabaseClient_1.supabase
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
            partner = await (0, partnerMatching_1.findPartnerForUser)(supabaseClient_1.supabase, user_id, primary_focus);
            partnerMatched = partner !== null;
        }
        catch (matchError) {
            console.error('Error finding partner:', matchError);
            // Continue even if matching fails - user is still registered
        }
        // Return success response
        const response = {
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
    }
    catch (error) {
        console.error('Error in register-intent endpoint:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});
app.post('/api/checkin', async (req, res) => {
    try {
        const { user_id, achieved_points, date } = req.body;
        if (!user_id || achieved_points === undefined) {
            return res.status(400).json({
                error: 'Missing required fields: user_id and achieved_points are required',
            });
        }
        // Use today's date if not provided
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const checkinDate = date || todayStr;
        const { data, error } = await supabaseClient_1.supabase
            .from('checkins')
            .insert([
            {
                user_id,
                achieved_points,
                date: checkinDate,
            },
        ])
            .select()
            .single();
        if (error) {
            console.error('Error inserting checkin:', error);
            return res.status(500).json({
                error: 'Failed to insert checkin',
                details: error.message,
            });
        }
        return res.json({
            status: 'ok',
            checkin: data,
        });
    }
    catch (error) {
        console.error('Error in checkin endpoint:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
