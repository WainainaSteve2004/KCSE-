-- KCSE AI Exam Platform Supabase Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK(role IN ('admin', 'teacher', 'student', 'developer')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subject_id BIGINT REFERENCES subjects(id),
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  exam_id BIGINT REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type TEXT CHECK(type IN ('theory', 'math', 'practical')) NOT NULL,
  marks INTEGER NOT NULL,
  correct_answer TEXT,
  marking_scheme TEXT
);

-- Student Answers table
CREATE TABLE IF NOT EXISTS student_answers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id UUID REFERENCES users(id),
  exam_id BIGINT REFERENCES exams(id),
  question_id BIGINT REFERENCES questions(id),
  answer_text TEXT,
  image_url TEXT,
  ai_score REAL,
  ai_feedback TEXT,
  teacher_score REAL,
  teacher_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id UUID REFERENCES users(id),
  exam_id BIGINT REFERENCES exams(id),
  total_score REAL,
  percentage REAL,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial subjects
INSERT INTO subjects (name) VALUES 
('Mathematics'), ('Biology'), ('Chemistry'), ('Physics'), ('English'), ('Kiswahili')
ON CONFLICT (name) DO NOTHING;
