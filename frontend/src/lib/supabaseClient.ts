import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihshzupksrhauzvsuxpm.supabase.co';
const supabaseAnonKey = 'sb_publishable_pxqSrFMJTGITBgZso2im_g_0srIynKx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
