-- KCSE AI Exam Platform Supabase Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK(role IN ('admin', 'teacher', 'student', 'developer')) NOT NULL,
  education_system TEXT, -- KCSE, CBE, KJSEA
  grade TEXT, -- Form 1, Grade 1, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  description TEXT
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Policies for subjects
CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'developer', 'teacher'))
);

-- Policies for users
CREATE POLICY "Users can read their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins and teachers can read all profiles" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher', 'developer'))
);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for exams
CREATE POLICY "Allow authenticated users to read exams" ON exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin, teacher, developer full access to exams" ON exams FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher', 'developer'))
);

-- Policies for questions
CREATE POLICY "Allow authenticated users to read questions" ON questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin, teacher, developer full access to questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher', 'developer'))
);

-- Policies for student_answers
CREATE POLICY "Students can manage their own answers" ON student_answers FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers and admins can read all student answers" ON student_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher', 'developer'))
);

-- Policies for results
CREATE POLICY "Students can read their own results" ON results FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers and admins can read all results" ON results FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher', 'developer'))
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subject_id BIGINT REFERENCES subjects(id),
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  education_system TEXT,
  grade TEXT,
  original_file_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  exam_id BIGINT REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  image_url TEXT,
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
