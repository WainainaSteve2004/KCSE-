import express from "express";
import { supabase } from "../lib/supabaseServer.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "kcse-secret-key-2026";

// Auth Middleware
export const authenticateToken = (req: any, res: any, next: any) => {
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
router.post("/auth/register", async (req, res) => {
  const { name, email, password, role, education_system, grade } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role, education_system, grade }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "An account with this email already exists." });
      }
      if (error.message.includes('permission denied')) {
        throw new Error("Permission denied: Please ensure RLS is disabled for the 'users' table or the SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.");
      }
      throw error;
    }

    res.json({ message: "Registration successful. Please log in." });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        education_system: user.education_system,
        grade: user.grade
      }, JWT_SECRET);
      res.json({ token, user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        education_system: user.education_system,
        grade: user.grade
      } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (e) {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Subjects
router.get("/subjects", async (req, res) => {
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(subjects);
});

router.post("/subjects", authenticateToken, async (req, res) => {
  const role = (req as any).user.role;
  if (role !== 'admin' && role !== 'developer') return res.sendStatus(403);
  const { name, code, description } = req.body;
  
  if (!name) return res.status(400).json({ error: "Subject Name is required" });

  const { data: subject, error } = await supabase
    .from('subjects')
    .insert([{ name, code, description }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: "Subject Name already exists" });
    return res.status(500).json({ error: error.message });
  }
  res.json(subject);
});

router.put("/subjects/:id", authenticateToken, async (req, res) => {
  const role = (req as any).user.role;
  if (role !== 'admin' && role !== 'developer') return res.sendStatus(403);
  const { name, code, description } = req.body;
  
  if (!name) return res.status(400).json({ error: "Subject Name is required" });

  const { data: subject, error } = await supabase
    .from('subjects')
    .update({ name, code, description })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: "Subject Name already exists" });
    return res.status(500).json({ error: error.message });
  }
  res.json(subject);
});

router.delete("/subjects/:id", authenticateToken, async (req, res) => {
  const role = (req as any).user.role;
  if (role !== 'admin' && role !== 'developer') return res.sendStatus(403);
  
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Exams
router.get("/exams", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  let query = supabase
    .from('exams')
    .select(`
      *,
      subjects (name)
    `);
  
  // Filter for students
  if (user.role === 'student' && user.education_system && user.grade) {
    query = query
      .eq('education_system', user.education_system)
      .eq('grade', user.grade);
  }

  const { data: exams, error } = await query;
  
  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten subject name
  const formattedExams = (exams || []).map((e: any) => ({
    ...e,
    subject_name: e.subjects?.name || "Unknown Subject"
  }));
  
  res.json(formattedExams);
});

router.get("/exams/:id", authenticateToken, async (req, res) => {
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

router.post("/exams", authenticateToken, async (req, res) => {
  const role = (req as any).user.role;
  if (role !== 'admin' && role !== 'developer' && role !== 'teacher') return res.sendStatus(403);
  const { subject_id, title, duration, questions, education_system, grade, original_file_url } = req.body;
  
  try {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert([{ 
        subject_id, 
        title, 
        duration, 
        education_system, 
        grade, 
        original_file_url,
        created_by: (req as any).user.id 
      }])
      .select()
      .single();

    if (examError) throw examError;

    const questionsToInsert = questions.map((q: any) => ({
      exam_id: exam.id,
      question_text: q.question_text,
      image_url: q.image_url,
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
router.post("/submissions", authenticateToken, async (req, res) => {
  const { exam_id, totalScore, percentage, results, answersToInsert } = req.body;
  const student_id = (req as any).user.id;

  try {
    // Save all answers
    const formattedAnswers = answersToInsert.map((ans: any) => ({
      student_id,
      exam_id,
      question_id: ans.question_id,
      answer_text: ans.answer_text,
      image_url: ans.image_url || null,
      ai_score: ans.ai_score,
      ai_feedback: ans.ai_feedback
    }));

    await supabase.from('student_answers').insert(formattedAnswers);

    await supabase.from('results').insert([{
      student_id,
      exam_id,
      total_score: totalScore,
      percentage,
      feedback: `You scored ${totalScore} points`
    }]);

    res.json({ totalScore, percentage, results });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Failed to process submission" });
  }
});

// Results
router.get("/results/student", authenticateToken, async (req, res) => {
  const { data: results, error } = await supabase
    .from('results')
    .select(`
      *,
      exams (
        title,
        subjects (name)
      )
    `)
    .eq('student_id', (req as any).user.id)
    .order('submitted_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  const formattedResults = (results || []).map((r: any) => ({
    ...r,
    exam_title: r.exams?.title || "Unknown Exam",
    subject_name: r.exams?.subjects?.name || "Unknown Subject"
  }));

  res.json(formattedResults);
});

router.get("/results/teacher", authenticateToken, async (req, res) => {
  if ((req as any).user.role === 'student') return res.sendStatus(403);
  
  const { data: results, error } = await supabase
    .from('results')
    .select(`
      *,
      users (name),
      exams (
        title,
        subjects (name)
      )
    `)
    .order('submitted_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const formattedResults = (results || []).map((r: any) => ({
    ...r,
    student_name: r.users?.name || "Unknown Student",
    exam_title: r.exams?.title || "Unknown Exam",
    subject_name: r.exams?.subjects?.name || "Unknown Subject"
  }));

  res.json(formattedResults);
});

router.get("/results/:examId/details", authenticateToken, async (req, res) => {
  const { examId } = req.params;
  const student_id = (req as any).user.id;

  try {
    // Get the result summary - take the latest one if multiple exist for this exam/student
    const { data: results, error: resultError } = await supabase
      .from('results')
      .select(`
        *,
        exams (
          title,
          subjects (name)
        )
      `)
      .eq('exam_id', examId)
      .eq('student_id', student_id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (resultError) throw resultError;
    const result = results?.[0];
    if (!result) return res.status(404).json({ error: "Result not found" });

    // Get the detailed answers - order by latest first
    const { data: answers, error: answersError } = await supabase
      .from('student_answers')
      .select(`
        *,
        questions (question_text, correct_answer, marks, type)
      `)
      .eq('exam_id', examId)
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (answersError) throw answersError;

    // Filter to keep only the latest answer for each question_id to handle multiple attempts
    const uniqueAnswers: any[] = [];
    const seenQuestions = new Set();
    if (answers) {
      for (const ans of answers) {
        if (!seenQuestions.has(ans.question_id)) {
          uniqueAnswers.push({
            ...ans,
            question_text: ans.questions?.question_text || "Unknown Question",
            correct_answer: ans.questions?.correct_answer || "",
            marks: ans.questions?.marks || 0,
            type: ans.questions?.type || "theory"
          });
          seenQuestions.add(ans.question_id);
        }
      }
    }

    res.json({
      summary: {
        ...result,
        exam_title: result.exams?.title || "Unknown Exam",
        subject_name: result.exams?.subjects?.name || "Unknown Subject"
      },
      answers: uniqueAnswers
    });
  } catch (error: any) {
    console.error("Error fetching result details:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      details: typeof error === 'object' ? JSON.stringify(error) : String(error)
    });
  }
});

// Analytics
router.get("/analytics", authenticateToken, async (req, res) => {
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

router.post("/admin/reset", authenticateToken, async (req, res) => {
  if ((req as any).user.role !== 'developer') return res.sendStatus(403);

  try {
    // Order matters for deletion due to foreign key constraints
    const tables = ['results', 'student_answers', 'questions', 'exams', 'subjects', 'users'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', table === 'users' ? '00000000-0000-0000-0000-000000000000' : -1);
      
      if (error) throw error;
    }
    res.json({ message: "Database reset successfully." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
