import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihshzupksrhauzvsuxpm.supabase.co';
const supabaseKey = 'sb_publishable_pxqSrFMJTGITBgZso2im_g_0srIynKx';

// This client is safe for frontend use with a publishable key.
export const supabase = createClient(supabaseUrl, supabaseKey);
