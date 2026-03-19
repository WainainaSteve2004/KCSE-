import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { supabase } from "./src/lib/supabaseServer.ts";
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
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      const { data: user, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword, role }])
        .select()
        .single();

      if (error) throw error;

      const token = jwt.sign({ id: user.id, email, role, name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name, email, role } });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (e) {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Subjects
  app.get("/api/subjects", async (req, res) => {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(subjects);
  });

  // Exams
  app.get("/api/exams", authenticateToken, async (req, res) => {
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        subjects (name)
      `);
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Flatten subject name
    const formattedExams = exams.map((e: any) => ({
      ...e,
      subject_name: e.subjects?.name
    }));
    
    res.json(formattedExams);
  });

  app.get("/api/exams/:id", authenticateToken, async (req, res) => {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (examError || !exam) return res.status(404).json({ error: "Exam not found" });

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', req.params.id);

    res.json({ ...exam, questions });
  });

  app.post("/api/exams", authenticateToken, async (req, res) => {
    const role = (req as any).user.role;
    if (role !== 'admin' && role !== 'developer') return res.sendStatus(403);
    const { subject_id, title, duration, questions } = req.body;
    
    try {
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert([{ subject_id, title, duration, created_by: (req as any).user.id }])
        .select()
        .single();

      if (examError) throw examError;

      const questionsToInsert = questions.map((q: any) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        type: q.type,
        marks: q.marks,
        correct_answer: q.correct_answer,
        marking_scheme: q.marking_scheme
      }));

      const { error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (qError) throw qError;

      res.json({ id: exam.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Submissions & AI Marking
  app.post("/api/submissions", authenticateToken, async (req, res) => {
    const { exam_id, answers } = req.body;
    const student_id = (req as any).user.id;

    try {
      let totalScore = 0;
      let maxPossibleScore = 0;
      const results = [];
      const answersToInsert = [];

      for (const ans of answers) {
        const { data: question } = await supabase
          .from('questions')
          .select('*')
          .eq('id', ans.question_id)
          .single();

        if (!question) continue;
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

        answersToInsert.push({
          student_id,
          exam_id,
          question_id: ans.question_id,
          answer_text: ans.answer_text,
          image_url: ans.image_url || null,
          ai_score: score,
          ai_feedback: feedback
        });
        
        results.push({ question_id: ans.question_id, score, feedback });
      }

      // Save all answers
      await supabase.from('student_answers').insert(answersToInsert);

      const percentage = (totalScore / maxPossibleScore) * 100;
      await supabase.from('results').insert([{
        student_id,
        exam_id,
        total_score: totalScore,
        percentage,
        feedback: `You scored ${totalScore} out of ${maxPossibleScore}`
      }]);

      res.json({ totalScore, percentage, results });
    } catch (error) {
      console.error("Submission error:", error);
      res.status(500).json({ error: "Failed to process submission" });
    }
  });

  // Results
  app.get("/api/results/student", authenticateToken, async (req, res) => {
    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        exams (title),
        subjects:exams(subjects(name))
      `)
      .eq('student_id', (req as any).user.id)
      .order('submitted_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    const formattedResults = results.map((r: any) => ({
      ...r,
      exam_title: r.exams?.title,
      subject_name: r.exams?.subjects?.name
    }));

    res.json(formattedResults);
  });

  app.get("/api/results/teacher", authenticateToken, async (req, res) => {
    if ((req as any).user.role === 'student') return res.sendStatus(403);
    
    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        users (name),
        exams (title),
        subjects:exams(subjects(name))
      `)
      .order('submitted_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formattedResults = results.map((r: any) => ({
      ...r,
      student_name: r.users?.name,
      exam_title: r.exams?.title,
      subject_name: r.exams?.subjects?.name
    }));

    res.json(formattedResults);
  });

  // Analytics
  app.get("/api/analytics", authenticateToken, async (req, res) => {
    if ((req as any).user.role === 'student') return res.sendStatus(403);
    
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    const { count: totalExams } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true });

    const { count: totalSubmissions } = await supabase
      .from('results')
      .select('*', { count: 'exact', head: true });

    const { data: scores } = await supabase
      .from('results')
      .select('percentage');

    const avgScore = scores && scores.length > 0 
      ? scores.reduce((acc, curr) => acc + curr.percentage, 0) / scores.length 
      : 0;

    res.json({
      totalStudents: { count: totalStudents },
      totalExams: { count: totalExams },
      totalSubmissions: { count: totalSubmissions },
      averageScore: { avg: avgScore },
    });
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
