import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db from "./src/database.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { markTheoryAnswer, markMathAnswer, analyzePracticalImage } from "./src/services/aiService.ts";

const JWT_SECRET = "kcse-secret-key-2026";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role);
      const token = jwt.sign({ id: result.lastInsertRowid, email, role, name }, JWT_SECRET);
      res.json({ token, user: { id: result.lastInsertRowid, name, email, role } });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Subjects
  app.get("/api/subjects", (req, res) => {
    const subjects = db.prepare('SELECT * FROM subjects').all();
    res.json(subjects);
  });

  // Exams
  app.get("/api/exams", authenticateToken, (req, res) => {
    const exams = db.prepare(`
      SELECT exams.*, subjects.name as subject_name 
      FROM exams 
      JOIN subjects ON exams.subject_id = subjects.id
    `).all();
    res.json(exams);
  });

  app.get("/api/exams/:id", authenticateToken, (req, res) => {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id) as any;
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ?').all();
    res.json({ ...exam, questions });
  });

  app.post("/api/exams", authenticateToken, (req, res) => {
    const role = (req as any).user.role;
    if (role !== 'admin' && role !== 'developer') return res.sendStatus(403);
    const { subject_id, title, duration, questions } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare('INSERT INTO exams (subject_id, title, duration, created_by) VALUES (?, ?, ?, ?)').run(subject_id, title, duration, (req as any).user.id);
      const examId = result.lastInsertRowid;
      
      const insertQuestion = db.prepare('INSERT INTO questions (exam_id, question_text, type, marks, correct_answer, marking_scheme) VALUES (?, ?, ?, ?, ?, ?)');
      for (const q of questions) {
        insertQuestion.run(examId, q.question_text, q.type, q.marks, q.correct_answer, q.marking_scheme);
      }
      return examId;
    });

    const examId = transaction();
    res.json({ id: examId });
  });

  // Submissions & AI Marking
  app.post("/api/submissions", authenticateToken, async (req, res) => {
    const { exam_id, answers } = req.body;
    const student_id = (req as any).user.id;

    try {
      let totalScore = 0;
      let maxPossibleScore = 0;

      const results = [];

      for (const ans of answers) {
        const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(ans.question_id) as any;
        maxPossibleScore += question.marks;

        let aiResult;
        if (question.type === 'theory') {
          aiResult = await markTheoryAnswer(question.question_text, question.marking_scheme, ans.answer_text, question.marks);
        } else if (question.type === 'math') {
          aiResult = await markMathAnswer(question.question_text, question.marking_scheme, ans.answer_text, question.marks);
        } else if (question.type === 'practical') {
          aiResult = await analyzePracticalImage(question.question_text, ans.image_data, ans.answer_text, question.marks);
        }

        const score = aiResult?.score || 0;
        const feedback = aiResult?.explanation || aiResult?.analysis || "No feedback provided";
        totalScore += score;

        db.prepare(`
          INSERT INTO student_answers (student_id, exam_id, question_id, answer_text, image_url, ai_score, ai_feedback)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(student_id, exam_id, ans.question_id, ans.answer_text, ans.image_url || null, score, feedback);
        
        results.push({ question_id: ans.question_id, score, feedback });
      }

      const percentage = (totalScore / maxPossibleScore) * 100;
      db.prepare('INSERT INTO results (student_id, exam_id, total_score, percentage, feedback) VALUES (?, ?, ?, ?, ?)').run(
        student_id, exam_id, totalScore, percentage, `You scored ${totalScore} out of ${maxPossibleScore}`
      );

      res.json({ totalScore, percentage, results });
    } catch (error) {
      console.error("Submission error:", error);
      res.status(500).json({ error: "Failed to process submission" });
    }
  });

  // Results
  app.get("/api/results/student", authenticateToken, (req, res) => {
    const results = db.prepare(`
      SELECT results.*, exams.title as exam_title, subjects.name as subject_name
      FROM results
      JOIN exams ON results.exam_id = exams.id
      JOIN subjects ON exams.subject_id = subjects.id
      WHERE results.student_id = ?
      ORDER BY submitted_at DESC
    `).all((req as any).user.id);
    res.json(results);
  });

  app.get("/api/results/teacher", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'student') return res.sendStatus(403);
    const results = db.prepare(`
      SELECT results.*, users.name as student_name, exams.title as exam_title, subjects.name as subject_name
      FROM results
      JOIN users ON results.student_id = users.id
      JOIN exams ON results.exam_id = exams.id
      JOIN subjects ON exams.subject_id = subjects.id
      ORDER BY submitted_at DESC
    `).all();
    res.json(results);
  });

  // Analytics
  app.get("/api/analytics", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'student') return res.sendStatus(403);
    const stats = {
      totalStudents: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get(),
      totalExams: db.prepare("SELECT COUNT(*) as count FROM exams").get(),
      totalSubmissions: db.prepare("SELECT COUNT(*) as count FROM results").get(),
      averageScore: db.prepare("SELECT AVG(percentage) as avg FROM results").get(),
    };
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
