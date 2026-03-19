-- KCSE AI Exam Platform - Supabase Schema (PostgreSQL)

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'teacher', 'student', 'developer')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Exams Table
CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions Table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type TEXT CHECK(type IN ('theory', 'math', 'practical')) NOT NULL,
  marks INTEGER NOT NULL,
  correct_answer TEXT,
  marking_scheme TEXT
);

-- Student Answers Table
CREATE TABLE student_answers (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  answer_text TEXT,
  image_url TEXT,
  ai_score REAL,
  ai_feedback TEXT,
  teacher_score REAL,
  teacher_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results Table
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  total_score REAL,
  percentage REAL,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Seed Data
-- Note: Passwords here are examples. In the app, they are hashed with bcrypt.
-- You can run these after setting up the tables.

-- INSERT INTO subjects (name) VALUES 
-- ('Mathematics'), ('Biology'), ('Chemistry'), ('Physics'), ('English'), ('Kiswahili');

/*
  SUPABASE STORAGE SETUP:
  1. Go to the 'Storage' tab in your Supabase dashboard.
  2. Create a new bucket named 'exam-images'.
  3. Set the bucket to 'Public' (or configure appropriate RLS policies).
  4. Ensure your SUPABASE_URL and SUPABASE_ANON_KEY are set in AI Studio Secrets.
*/
