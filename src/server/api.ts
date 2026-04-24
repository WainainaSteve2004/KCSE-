import express from "express";
import { supabase } from "../lib/supabaseServer.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "examina-secret-key-2026";

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
  
  // Requirement: Admin access restricted to specific credentials
  const ADMIN_EMAIL = 'charles.ngiabi@kutambua.com';
  const ADMIN_PASS = '41272959C';

  console.log(`Login attempt for: ${email}`);

  try {
    if (!process.env.SUPABASE_URL) {
      console.error("SUPABASE_URL is missing in environment variables");
      return res.status(500).json({ error: "Server configuration error: SUPABASE_URL missing" });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (user && bcrypt.compareSync(password, user.password)) {
      // If user exists and password matches, check if it's the admin email
      // If it is the admin email, ensure they have the admin role
      if (email === ADMIN_EMAIL && user.role !== 'admin') {
        await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
        user.role = 'admin';
      }
      
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
    } else if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // If user doesn't exist but credentials match the hardcoded admin, create them
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ 
          name: 'Admin Charles', 
          email, 
          password: hashedPassword, 
          role: 'admin' 
        }])
        .select()
        .single();
        
      if (createError) throw createError;
      
      const token = jwt.sign({ 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role, 
        name: newUser.name 
      }, JWT_SECRET);
      
      res.json({ token, user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role 
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
  
  if (questions && questions.length > 50) {
    return res.status(400).json({ error: "Exam cannot exceed 50 questions." });
  }

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
  const user = (req as any).user;
  const student_id = (user.role === 'admin' || user.role === 'developer' || user.role === 'teacher') 
    ? (req.query.studentId || user.id) 
    : user.id;

  try {
    // Get the result summary - take the latest one if multiple exist for this exam/student
    const { data: results, error: resultError } = await supabase
      .from('results')
      .select(`
        *,
        users (name),
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
        student_name: result.users?.name || "Unknown Student",
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
  
  try {
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

    // Performance by Subject
    const { data: subjectPerformance } = await supabase
      .from('results')
      .select(`
        percentage,
        exams (
          subjects (name)
        )
      `);

    const subjectMap: Record<string, { total: number, count: number }> = {};
    subjectPerformance?.forEach((r: any) => {
      const name = r.exams?.subjects?.name || "Unknown";
      if (!subjectMap[name]) subjectMap[name] = { total: 0, count: 0 };
      subjectMap[name].total += r.percentage;
      subjectMap[name].count += 1;
    });

    const performanceBySubject = Object.entries(subjectMap).map(([name, data]) => ({
      name,
      score: Math.round(data.total / data.count)
    })).sort((a, b) => b.score - a.score);

    // Participation Over Time (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: participationData } = await supabase
      .from('results')
      .select('submitted_at')
      .gte('submitted_at', sevenDaysAgo.toISOString());

    const participationMap: Record<string, number> = {};
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      participationMap[dateStr] = 0;
    }

    participationData?.forEach((r: any) => {
      const dateStr = new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      if (participationMap[dateStr] !== undefined) {
        participationMap[dateStr] += 1;
      }
    });

    const participationOverTime = Object.entries(participationMap).map(([date, count]) => ({
      date,
      count
    }));

    // Recent Activity
    const { data: recentActivityData } = await supabase
      .from('results')
      .select(`
        percentage,
        submitted_at,
        users (name),
        exams (
          title,
          grade,
          subjects (name)
        )
      `)
      .order('submitted_at', { ascending: false })
      .limit(5);

    const recentActivity = recentActivityData?.map((r: any) => ({
      studentName: r.users?.name,
      examTitle: r.exams?.title,
      subjectName: r.exams?.subjects?.name,
      grade: r.exams?.grade,
      score: r.percentage,
      time: r.submitted_at
    }));

    // Top Performer
    const { data: topPerformerData } = await supabase
      .from('results')
      .select(`
        percentage,
        users (name, grade)
      `);

    const studentAvgMap: Record<string, { total: number, count: number, name: string, grade: string }> = {};
    topPerformerData?.forEach((r: any) => {
      const name = r.users?.name;
      if (!name) return;
      if (!studentAvgMap[name]) {
        studentAvgMap[name] = { total: 0, count: 0, name, grade: r.users?.grade };
      }
      studentAvgMap[name].total += r.percentage;
      studentAvgMap[name].count += 1;
    });

    const topPerformer = Object.values(studentAvgMap)
      .map(s => ({ name: s.name, grade: s.grade, avg: s.total / s.count }))
      .sort((a, b) => b.avg - a.avg)[0] || null;

    res.json({
      totalStudents: { count: totalStudents },
      totalExams: { count: totalExams },
      totalSubmissions: { count: totalSubmissions },
      averageScore: { avg: avgScore },
      performanceBySubject,
      participationOverTime,
      recentActivity,
      topPerformer
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/users", authenticateToken, async (req, res) => {
  const role = (req as any).user.role;
  if (role !== 'admin' && role !== 'developer' && role !== 'teacher') return res.sendStatus(403);
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, education_system, grade, created_at')
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(users);
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

// Users & Profile
router.get("/users/me", authenticateToken, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, education_system, grade')
    .eq('id', (req as any).user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(user);
});

router.put("/users/me", authenticateToken, async (req, res) => {
  const { name, education_system, grade } = req.body;
  const userRole = (req as any).user.role;
  
  const updateData: any = { name };
  
  // Requirement: Students cannot modify education_system and grade once set
  // Only non-students (admin/teacher/developer) or the system can update these
  if (userRole !== 'student') {
    if (education_system) updateData.education_system = education_system;
    if (grade) updateData.grade = grade;
  }

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', (req as any).user.id)
    .select('id, name, email, role, education_system, grade')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(user);
});

export default router;
