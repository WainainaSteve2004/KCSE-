import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!process.env.SUPABASE_URL) {
  console.warn('Backend Supabase URL is missing. Please set SUPABASE_URL in your environment variables.');
}

if (supabaseServiceRoleKey) {
  console.log('Backend: Using SUPABASE_SERVICE_ROLE_KEY for database operations.');
} else {
  console.warn('Backend: SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to SUPABASE_ANON_KEY.');
}

const keyToUse = supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-key';
export const supabase = createClient(supabaseUrl, keyToUse);
