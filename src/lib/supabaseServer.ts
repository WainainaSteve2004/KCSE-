import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.warn('Backend Supabase URL is missing.');
}

if (supabaseServiceRoleKey) {
  console.log('Backend: Using SUPABASE_SERVICE_ROLE_KEY for database operations.');
} else {
  console.warn('Backend: SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to SUPABASE_ANON_KEY (RLS may block operations).');
}

const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;
export const supabase = createClient(supabaseUrl, keyToUse);
