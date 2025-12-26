"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastDayOfMonth = isLastDayOfMonth;
exports.getCurrentMonthString = getCurrentMonthString;
exports.findPartnerForUser = findPartnerForUser;
/**
 * Check if the given date is the last day of the month
 */
function isLastDayOfMonth(date) {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return nextDay.getMonth() !== date.getMonth();
}
/**
 * Get current month string in format 'YYYY-MM'
 */
function getCurrentMonthString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}
/**
 * Find and match a partner for a user based on primary focus
 * @param supabase - Supabase client with service role key
 * @param userId - ID of the user looking for a partner
 * @param primaryFocus - The primary focus area (e.g., 'No Porn', 'Fitness', etc.)
 * @returns Matched user row or null if no match found
 */
async function findPartnerForUser(supabase, userId, primaryFocus) {
    try {
        // First, check if the current user already has a partner
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('id, partner_id')
            .eq('id', userId)
            .single();
        if (userError) {
            throw userError;
        }
        if (currentUser?.partner_id) {
            // User already has a partner
            return null;
        }
        // Find a user with matching primary_focus who doesn't have a partner yet
        const { data: potentialPartner, error: findError } = await supabase
            .from('users')
            .select('id, email, primary_focus, joined_month, is_new_user')
            .eq('primary_focus', primaryFocus)
            .is('partner_id', null)
            .neq('id', userId)
            .limit(1)
            .single();
        if (findError) {
            // If no rows found, that's okay - just return null
            if (findError.code === 'PGRST116') {
                return null;
            }
            throw findError;
        }
        if (!potentialPartner) {
            return null;
        }
        // Match the two users by setting partner_id on both
        const partnerId = potentialPartner.id;
        // Update current user with partner_id
        const { error: updateUser1Error } = await supabase
            .from('users')
            .update({ partner_id: partnerId })
            .eq('id', userId);
        if (updateUser1Error) {
            throw updateUser1Error;
        }
        // Update partner with current user's id
        const { error: updateUser2Error } = await supabase
            .from('users')
            .update({ partner_id: userId })
            .eq('id', partnerId);
        if (updateUser2Error) {
            // Rollback: remove partner_id from first user if second update fails
            await supabase
                .from('users')
                .update({ partner_id: null })
                .eq('id', userId);
            throw updateUser2Error;
        }
        return potentialPartner;
    }
    catch (error) {
        console.error('Error in findPartnerForUser:', error);
        throw error;
    }
}
