-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX SCHEMA ERRORS
-- This script adds missing columns and forces Supabase to refresh its schema cache.

-- 1. Update Users Table
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS education_system TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Update Exams Table
ALTER TABLE IF EXISTS exams ADD COLUMN IF NOT EXISTS education_system TEXT;
ALTER TABLE IF EXISTS exams ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE IF EXISTS exams ADD COLUMN IF NOT EXISTS original_file_url TEXT;

-- 3. Update Questions Table
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Force Schema Cache Refresh
-- Adding and dropping a column is a reliable way to trigger a cache refresh in PostgREST
ALTER TABLE users ADD COLUMN IF NOT EXISTS _cache_refresh_temp TEXT;
ALTER TABLE users DROP COLUMN IF EXISTS _cache_refresh_temp;

-- 4. Disable Row Level Security (RLS) for the users table
-- This allows the custom registration API to insert users directly
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- 5. Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Verify Table Structure (Optional check)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
