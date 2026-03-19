import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const db = new Database('kcse_exam.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'teacher', 'student', 'developer')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    created_by INTEGER NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    type TEXT CHECK(type IN ('theory', 'math', 'practical')) NOT NULL,
    marks INTEGER NOT NULL,
    correct_answer TEXT,
    marking_scheme TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS student_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_text TEXT,
    image_url TEXT,
    ai_score REAL,
    ai_feedback TEXT,
    teacher_score REAL,
    teacher_feedback TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    total_score REAL,
    percentage REAL,
    feedback TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const salt = bcrypt.genSaltSync(10);
  
  const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  
  insertUser.run('Developer User', 'developer@kcse.ai', bcrypt.hashSync('Dev@123', salt), 'developer');
  insertUser.run('Admin User', 'admin@kcse.ai', bcrypt.hashSync('Admin@123', salt), 'admin');
  insertUser.run('Teacher User', 'teacher@kcse.ai', bcrypt.hashSync('Teacher@123', salt), 'teacher');
  insertUser.run('Student User', 'student@kcse.ai', bcrypt.hashSync('Student@123', salt), 'student');

  const subjects = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'English', 'Kiswahili'];
  const insertSubject = db.prepare('INSERT INTO subjects (name) VALUES (?)');
  subjects.forEach(s => insertSubject.run(s));
}

export default db;
