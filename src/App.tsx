import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { 
  BookOpen, 
  GraduationCap, 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut, 
  Plus, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  Upload,
  BrainCircuit,
  Calculator,
  FlaskConical
} from 'lucide-react';

// --- Types ---
type Role = 'admin' | 'teacher' | 'student' | 'developer';
interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// --- Components ---

const Navbar = () => {
  const auth = useContext(AuthContext);
  if (!auth?.user) return null;

  return (
    <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight text-zinc-900">KCSE AI</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">{auth.user.name}</p>
          <p className="text-xs text-zinc-500 capitalize">{auth.user.role}</p>
        </div>
        <button 
          onClick={auth.logout}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

const Sidebar = ({ currentTab, setTab }: { currentTab: string, setTab: (t: string) => void }) => {
  const auth = useContext(AuthContext);
  const role = auth?.user?.role;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student', 'developer'] },
    { id: 'exams', label: 'Exams', icon: FileText, roles: ['admin', 'teacher', 'student', 'developer'] },
    { id: 'results', label: 'Results', icon: CheckCircle2, roles: ['admin', 'teacher', 'student', 'developer'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin', 'developer'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'teacher', 'developer'] },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 h-[calc(100vh-73px)] p-4 flex flex-col gap-2 bg-zinc-50/50">
      {menuItems.filter(item => item.roles.includes(role!)).map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentTab === item.id 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </aside>
  );
};

// --- Pages ---

const LoginPage = ({ onAuth }: { onAuth: (token: string, user: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { role: 'Developer', email: 'developer@kcse.ai', password: 'Dev@123', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
    { role: 'Admin', email: 'admin@kcse.ai', password: 'Admin@123', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { role: 'Teacher', email: 'teacher@kcse.ai', password: 'Teacher@123', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { role: 'Student', email: 'student@kcse.ai', password: 'Student@123', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const autofill = (acc: any) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setIsRegister(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { name, email, password, role } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onAuth(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl mb-4">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">KCSE AI Platform</h1>
          <p className="text-zinc-500 text-center mt-2">
            {isRegister ? 'Create your account to start learning' : 'Welcome back! Please login to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
              <select 
                value={role} onChange={e => setRole(e.target.value as Role)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>

        {!isRegister && (
          <div className="mt-10 pt-8 border-t border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-center mb-6">Demo Credentials (Click to Autofill)</h3>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => autofill(acc)}
                  className="flex flex-col items-center p-4 rounded-2xl border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className={`${acc.bg} ${acc.color} p-2 rounded-xl mb-2 group-hover:scale-110 transition-transform`}>
                    <acc.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900">{acc.role}</span>
                  <span className="text-[10px] text-zinc-400 mt-1">{acc.password}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const [stats, setStats] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { data, error } = await supabase.from('subjects').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setSupabaseStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setSupabaseStatus('error');
      }
    };
    checkSupabase();

    if (auth?.user?.role !== 'student') {
      fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      })
      .then(res => res.json())
      .then(setStats);
    }
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 capitalize">{auth?.user?.role} Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back, {auth?.user?.name}. Here's what's happening today.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
          supabaseStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          supabaseStatus === 'error' ? 'bg-red-50 text-red-600 border-red-200' :
          'bg-zinc-50 text-zinc-400 border-zinc-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            supabaseStatus === 'connected' ? 'bg-emerald-500' :
            supabaseStatus === 'error' ? 'bg-red-500' :
            'bg-zinc-300 animate-pulse'
          }`} />
          Supabase: {supabaseStatus === 'connected' ? 'Connected' : supabaseStatus === 'error' ? 'Disconnected' : 'Checking...'}
        </div>
      </header>

      {auth?.user?.role !== 'student' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Students', value: stats.totalStudents.count, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Exams', value: stats.totalExams.count, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Submissions', value: stats.totalSubmissions.count, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Avg. Score', value: `${Math.round(stats.averageScore.avg || 0)}%`, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">Biology Paper 1 - Practical</p>
                  <p className="text-xs text-zinc-500">Submitted 2 hours ago • Marked by AI</p>
                </div>
                <div className="ml-auto text-emerald-600 font-bold">84%</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-indigo-600 p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Ready for your next exam?</h2>
            <p className="text-indigo-100 mb-6 max-w-xs">Take a practice KCSE paper and get instant AI feedback on your performance.</p>
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all">
              Browse Exams
            </button>
          </div>
          <BrainCircuit className="absolute -right-8 -bottom-8 w-48 h-48 text-indigo-500/30" />
        </div>
      </div>
    </div>
  );
};

const ExamList = ({ onSelectExam }: { onSelectExam: (id: number) => void }) => {
  const auth = useContext(AuthContext);
  const [exams, setExams] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch('/api/exams', {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    })
    .then(res => res.json())
    .then(setExams);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Available Exams</h1>
          <p className="text-zinc-500 mt-1">Select a paper to start your examination.</p>
        </div>
        {auth?.user?.role === 'admin' && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Exam
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <motion.div 
            key={exam.id}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onSelectExam(exam.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {exam.subject_name}
              </span>
              <div className="flex items-center gap-1 text-zinc-400 text-sm">
                <Clock className="w-4 h-4" />
                {exam.duration}m
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">{exam.title}</h3>
            <p className="text-zinc-500 text-sm mt-2 line-clamp-2">Comprehensive KCSE past paper covering core curriculum topics.</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200" />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  +12
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {showCreate && <CreateExamModal onClose={() => setShowCreate(false)} onCreated={() => {
        setShowCreate(false);
        // Refresh list
        fetch('/api/exams', { headers: { 'Authorization': `Bearer ${auth?.token}` } })
          .then(res => res.json())
          .then(setExams);
      }} />}
    </div>
  );
};

const CreateExamModal = ({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) => {
  const auth = useContext(AuthContext);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState('120');
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/subjects').then(res => res.json()).then(setSubjects);
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', type: 'theory', marks: 10, correct_answer: '', marking_scheme: '' }]);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}`
      },
      body: JSON.stringify({ title, subject_id: subjectId, duration, questions })
    });
    if (res.ok) onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900">Create New Exam</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">✕</button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Exam Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Biology Paper 1 2025" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none bg-white">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Duration (mins)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Questions</h3>
              <button onClick={addQuestion} className="text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {questions.map((q, i) => (
              <div key={i} className="p-6 bg-zinc-50 rounded-2xl space-y-4 border border-zinc-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Question Text</label>
                    <textarea 
                      value={q.question_text} 
                      onChange={e => {
                        const newQ = [...questions];
                        newQ[i].question_text = e.target.value;
                        setQuestions(newQ);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none h-24" 
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                      <select 
                        value={q.type} 
                        onChange={e => {
                          const newQ = [...questions];
                          newQ[i].type = e.target.value;
                          setQuestions(newQ);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none bg-white"
                      >
                        <option value="theory">Theory</option>
                        <option value="math">Mathematics</option>
                        <option value="practical">Practical (Image)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Marks</label>
                      <input 
                        type="number" 
                        value={q.marks} 
                        onChange={e => {
                          const newQ = [...questions];
                          newQ[i].marks = parseInt(e.target.value);
                          setQuestions(newQ);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none" 
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Marking Scheme / Correct Answer</label>
                  <textarea 
                    value={q.marking_scheme} 
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[i].marking_scheme = e.target.value;
                      setQuestions(newQ);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none h-20" 
                    placeholder="Provide details for AI marking..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100">Cancel</button>
          <button onClick={handleSubmit} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Exam</button>
        </div>
      </motion.div>
    </div>
  );
};

const ExamPage = ({ examId, onFinish }: { examId: number, onFinish: () => void }) => {
  const auth = useContext(AuthContext);
  const [exam, setExam] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/exams/${examId}`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    })
    .then(res => res.json())
    .then(data => {
      setExam(data);
      setTimeLeft(data.duration * 60);
    });
  }, [examId]);

  useEffect(() => {
    if (timeLeft > 0 && !results) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam && !results) {
      handleSubmit();
    }
  }, [timeLeft, exam, results]);

  const handleAnswerChange = (val: string) => {
    setAnswers({ ...answers, [exam.questions[currentQuestionIndex].id]: { ...answers[exam.questions[currentQuestionIndex].id], text: val } });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswers({ 
          ...answers, 
          [exam.questions[currentQuestionIndex].id]: { 
            ...answers[exam.questions[currentQuestionIndex].id], 
            image: reader.result 
          } 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      exam_id: examId,
      answers: Object.entries(answers).map(([qId, data]: [string, any]) => ({
        question_id: parseInt(qId),
        answer_text: data.text || '',
        image_data: data.image || null
      }))
    };

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) return <div className="flex items-center justify-center h-full">Loading exam...</div>;

  if (results) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto space-y-8 py-12"
      >
        <div className="bg-white p-12 rounded-[40px] border border-zinc-200 shadow-xl text-center">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900">Exam Completed!</h1>
          <p className="text-zinc-500 mt-2">Your paper has been marked by our AI system.</p>
          
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="p-8 bg-zinc-50 rounded-3xl">
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Total Score</p>
              <p className="text-5xl font-black text-zinc-900 mt-2">{results.totalScore}</p>
            </div>
            <div className="p-8 bg-indigo-600 text-white rounded-3xl">
              <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Percentage</p>
              <p className="text-5xl font-black mt-2">{Math.round(results.percentage)}%</p>
            </div>
          </div>

          <button 
            onClick={onFinish}
            className="mt-12 w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900">Detailed Feedback</h2>
          {results.results.map((res: any, i: number) => {
            const q = exam.questions.find((q: any) => q.id === res.question_id);
            return (
              <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-400 uppercase">Question {i + 1}</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">
                    Score: {res.score}/{q.marks}
                  </span>
                </div>
                <p className="text-lg font-medium text-zinc-900">{q.question_text}</p>
                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-xs font-bold text-zinc-400 uppercase mb-2">AI Analysis</p>
                  <p className="text-zinc-700 leading-relaxed">{res.feedback}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm sticky top-20 z-40">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">{exam.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-zinc-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
            <div className="w-48 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500" 
                style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }} 
              />
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-mono font-bold text-xl ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-zinc-50 text-zinc-900'}`}>
          <Clock className="w-6 h-6" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm min-h-[400px] flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              {currentQuestion.type === 'theory' && <FileText className="text-blue-600 w-6 h-6" />}
              {currentQuestion.type === 'math' && <Calculator className="text-purple-600 w-6 h-6" />}
              {currentQuestion.type === 'practical' && <FlaskConical className="text-emerald-600 w-6 h-6" />}
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{currentQuestion.type}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 leading-tight mb-8">
              {currentQuestion.question_text}
            </h2>

            <div className="mt-auto space-y-6">
              {currentQuestion.type === 'practical' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-zinc-500 uppercase">Upload Experiment Image</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      {answers[currentQuestion.id]?.image ? (
                        <img src={answers[currentQuestion.id].image} className="max-h-48 rounded-xl shadow-lg" />
                      ) : (
                        <>
                          <Camera className="w-10 h-10 text-zinc-300 group-hover:text-indigo-500 mb-2" />
                          <span className="text-sm text-zinc-500 group-hover:text-indigo-600">Click to capture or upload apparatus image</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-sm font-bold text-zinc-500 uppercase">Your Answer</label>
                <textarea 
                  value={answers[currentQuestion.id]?.text || ''}
                  onChange={e => handleAnswerChange(e.target.value)}
                  placeholder="Type your explanation or solution here..."
                  className="w-full p-6 bg-zinc-50 rounded-3xl border border-zinc-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all h-48 resize-none text-lg"
                />
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-between">
            <button 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              className="px-8 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-all"
            >
              Previous
            </button>
            {currentQuestionIndex === exam.questions.length - 1 ? (
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="px-12 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-12 py-4 rounded-2xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                Next Question
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-3">
              {exam.questions.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                    currentQuestionIndex === i 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : answers[exam.questions[i].id] 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100">
            <div className="flex items-center gap-3 text-amber-700 mb-4">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold">Exam Instructions</h4>
            </div>
            <ul className="text-sm text-amber-800/80 space-y-3 list-disc pl-4">
              <li>Answers are saved automatically as you navigate.</li>
              <li>For practical questions, ensure the image is clear.</li>
              <li>The exam will auto-submit when the timer reaches zero.</li>
              <li>Do not refresh the page during the examination.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState('dashboard');
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuth = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!token) {
    return <LoginPage onAuth={handleAuth} />;
  }

  return (
    <AuthContext.Provider value={{ user, token, login: handleAuth, logout }}>
      <div className="min-h-screen bg-zinc-50 font-sans">
        <Navbar />
        <div className="flex">
          <Sidebar currentTab={tab} setTab={setTab} />
          <main className="flex-1 p-8 max-h-[calc(100vh-73px)] overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedExamId ? (
                <ExamPage examId={selectedExamId} onFinish={() => setSelectedExamId(null)} />
              ) : (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {tab === 'dashboard' && <Dashboard />}
                  {tab === 'exams' && <ExamList onSelectExam={setSelectedExamId} />}
                  {tab === 'results' && <div className="p-12 text-center text-zinc-500">Results history coming soon...</div>}
                  {tab === 'users' && <div className="p-12 text-center text-zinc-500">User management coming soon...</div>}
                  {tab === 'analytics' && <div className="p-12 text-center text-zinc-500">Advanced analytics coming soon...</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
