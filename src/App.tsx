import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  FlaskConical,
  Trash2,
  X,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import BulkExamUploader from './components/BulkExamUploader';
import SubjectManager from './components/SubjectManager';
import Results from './components/Results';
import UsersList from './components/UsersList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { markTheoryAnswer, markMathAnswer, analyzePracticalImage } from './services/aiService';

// --- Types ---
type Role = 'admin' | 'teacher' | 'student' | 'developer';
interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  education_system?: string;
  grade?: string;
}

export const EDUCATION_SYSTEMS = ['KCSE', 'CBE', 'KJSEA'];
export const GRADES: Record<string, string[]> = {
  'KCSE': ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
  'CBE': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  'KJSEA': ['Grade 7', 'Grade 8', 'Grade 9']
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

// --- Components ---

const Navbar = () => {
  const auth = useContext(AuthContext);
  const theme = useContext(ThemeContext);
  if (!auth?.user) return null;

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">KCSE AI</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={theme?.toggleDarkMode}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-500 dark:text-zinc-400"
          title={theme?.isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme?.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{auth.user.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{auth.user.role}</p>
          </div>
          <button 
            onClick={auth.logout}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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
    { id: 'profile', label: 'My Profile', icon: Users, roles: ['student'] },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, roles: ['admin', 'developer'] },
    { id: 'bulk-uploader', label: 'Bulk Uploader', icon: Upload, roles: ['admin', 'developer'] },
    { id: 'results', label: 'Results', icon: CheckCircle2, roles: ['admin', 'teacher', 'student', 'developer'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin', 'developer'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'teacher', 'developer'] },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 h-[calc(100vh-73px)] p-4 flex flex-col gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors">
      {menuItems.filter(item => item.roles.includes(role!)).map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentTab === item.id 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/20' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [educationSystem, setEducationSystem] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setShowTroubleshoot(false);
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister 
      ? { name, email, password, role, education_system: educationSystem, grade } 
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}. This usually means the backend crashed or environment variables are missing.`);
      }

      if (res.ok) {
        if (isRegister) {
          setSuccess(data.message || 'Registration successful. Please log in.');
          setIsRegister(false);
          setPassword('');
        } else {
          onAuth(data.token, data.user);
        }
      } else {
        setError(data.error || 'Authentication failed');
        if (data.error?.includes('permission denied')) {
          setShowTroubleshoot(true);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message === 'Failed to fetch' || err.message.includes('Connection error') 
        ? 'Connection error: Could not reach the server. Please check your internet or if the backend is running.' 
        : err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl mb-4">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">KCSE AI Platform</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mt-2">
            {isRegister ? 'Create your account to start learning' : 'Welcome back! Please login to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Role</label>
              <div className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium">
                Student
              </div>
            </div>
          )}

          {isRegister && role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Education System</label>
                <select 
                  value={educationSystem} 
                  onChange={e => {
                    setEducationSystem(e.target.value);
                    setGrade('');
                  }}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                >
                  <option value="">Select System</option>
                  {EDUCATION_SYSTEMS.map(sys => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>
              {educationSystem && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Grade</label>
                  <select 
                    value={grade} 
                    onChange={e => setGrade(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  >
                    <option value="">Select Grade</option>
                    {GRADES[educationSystem].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="flex-1">{success}</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
              {showTroubleshoot && (
                <div className="p-4 bg-zinc-900 dark:bg-black text-zinc-100 rounded-xl text-[11px] flex flex-col gap-2 shadow-lg border border-zinc-700">
                  <p className="font-bold text-indigo-400 uppercase tracking-wider">Troubleshooting Guide</p>
                  <p>This error means Supabase is blocking the registration. Follow these steps:</p>
                  <div className="space-y-2">
                    <p>1. Open your <b>Supabase SQL Editor</b>.</p>
                    <p>2. Run this command to fix permissions:</p>
                    <pre className="bg-black/50 p-2 rounded border border-zinc-700 font-mono text-indigo-300 select-all">
                      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
                    </pre>
                    <p>3. If it still fails, ensure your <b>SUPABASE_SERVICE_ROLE_KEY</b> is added to AI Studio Secrets.</p>
                    <hr className="border-zinc-700 my-2" />
                    <p className="font-bold text-indigo-400 uppercase tracking-wider">Resetting Database (DANGER)</p>
                    <p>To remove all data and start fresh, run this in your SQL Editor:</p>
                    <pre className="bg-black/50 p-2 rounded border border-zinc-700 font-mono text-indigo-300 select-all overflow-x-auto">
                      {`TRUNCATE results, student_answers, questions, exams, subjects, users CASCADE;`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
          >
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (auth?.user?.role !== 'student') {
      fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) setStats(data);
      })
      .catch(() => setStats(null));
    }
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white capitalize">{auth?.user?.role} Dashboard</h1>
        <div className="mt-2">
          {auth?.user?.role === 'student' ? (
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Welcome back, {auth?.user?.name.split(' ')[0]}. This is your {auth?.user?.grade} Dashboard.
              </h2>
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              Welcome back, {auth?.user?.name}. Here's what's happening today.
            </p>
          )}
        </div>
      </header>

      {auth?.user?.role !== 'student' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Students', value: stats.totalStudents.count, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Active Exams', value: stats.totalExams.count, icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Submissions', value: stats.totalSubmissions.count, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Avg. Score', value: `${Math.round(stats.averageScore.avg || 0)}%`, icon: BarChart3, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-6">
            <div className="p-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">No recent activity to show.</p>
            </div>
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

      {auth?.user?.role === 'developer' && (
        <div className="bg-zinc-900 p-8 rounded-3xl text-white border border-zinc-700 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Developer Tools</h2>
          </div>
          <p className="text-zinc-400 mb-6">These tools are only visible to developers. Use with caution.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={async () => {
                if (window.confirm('DANGER: This will permanently delete all users, exams, and results. Are you sure?')) {
                  try {
                    const res = await fetch('/api/admin/reset', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${auth?.token}` }
                    });
                    if (res.ok) {
                      alert('Database reset successfully. You will be logged out.');
                      auth.logout();
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Reset failed');
                    }
                  } catch (err) {
                    alert('Connection error');
                  }
                }
              }}
              className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all text-center"
            >
              Reset Entire Database
            </button>
            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">SQL Snippet</p>
              <code className="text-[10px] text-indigo-400 select-all">
                TRUNCATE results, student_answers, questions, exams, subjects, users CASCADE;
              </code>
            </div>
          </div>
        </div>
      )}
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
    .then(res => res.ok ? res.json() : [])
    .then(data => Array.isArray(data) ? setExams(data) : setExams([]))
    .catch(() => setExams([]));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Available Exams</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Select a paper to start your examination.</p>
        </div>
        {(auth?.user?.role === 'admin' || auth?.user?.role === 'teacher' || auth?.user?.role === 'developer') && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
          >
            <Plus className="w-5 h-5" />
            Create Exam
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(exams) && exams.map((exam, i) => exam && (
          <motion.div 
            key={exam.id || i}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all cursor-pointer group"
            onClick={() => onSelectExam(exam.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  {exam.subject_name || "General"}
                </span>
                {exam.grade && (
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {exam.grade}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-sm">
                <Clock className="w-4 h-4" />
                {exam.duration}m
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{exam.title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 line-clamp-2">Test your knowledge in {exam.subject_name || "this subject"}.</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                  ?
                </div>
                {exam.original_file_url && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                    <FileText className="w-3 h-3" />
                    Doc
                  </span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
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
  const [educationSystem, setEducationSystem] = useState(auth?.user?.education_system || '');
  const [grade, setGrade] = useState(auth?.user?.grade || '');

  useEffect(() => {
    if (auth?.user?.education_system) setEducationSystem(auth.user.education_system);
    if (auth?.user?.grade) setGrade(auth.user.grade);
  }, [auth?.user]);

  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setSubjects(data) : setSubjects([]))
      .catch(() => setSubjects([]));
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', type: 'theory', marks: 10, correct_answer: '', marking_scheme: '' }]);
  };

  const handleSubmit = async () => {
    if (!title || !subjectId || questions.length === 0 || !educationSystem || !grade) {
      setError('Please provide a title, subject, education system, grade, and at least one question.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ 
          title, 
          subject_id: subjectId, 
          duration, 
          questions,
          education_system: educationSystem,
          grade,
          original_file_url: originalFileUrl
        })
      });
      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save exam');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
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
                {Array.isArray(subjects) && subjects.map((s, i) => <option key={s.id || i} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Duration (mins)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Education System</label>
              <select 
                value={educationSystem} 
                onChange={e => {
                  setEducationSystem(e.target.value);
                  setGrade('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none bg-white"
              >
                <option value="">Select System</option>
                {EDUCATION_SYSTEMS.map(sys => <option key={sys} value={sys}>{sys}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Grade</label>
              <select 
                value={grade} 
                onChange={e => setGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none bg-white"
                disabled={!educationSystem}
              >
                <option value="">Select Grade</option>
                {educationSystem && GRADES[educationSystem].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-200">
            <h3 className="text-sm font-bold text-zinc-700 uppercase mb-4">Original Document (Optional)</h3>
            <div className="flex items-center gap-4">
              {originalFileUrl ? (
                <div className="flex-1 flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <span className="text-sm font-medium text-zinc-900">Document Attached</span>
                  </div>
                  <button onClick={() => setOriginalFileUrl(null)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex-1 cursor-pointer">
                  <div className="p-8 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                    <Upload className="w-8 h-8 text-zinc-300 group-hover:text-indigo-500 mb-2" />
                    <span className="text-sm text-zinc-500 group-hover:text-indigo-600 font-medium">Click to upload original PDF/Image</span>
                    <span className="text-xs text-zinc-400 mt-1">This will be visible to students for reference</span>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf,.png,.jpg,.jpeg,.docx" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setOriginalFileUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
              )}
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
              <div key={q.id || i} className="p-6 bg-zinc-50 rounded-2xl space-y-4 border border-zinc-200">
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
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Question Image (Optional)</label>
                      <div className="flex items-center gap-4">
                        {q.image_url && (
                          <img src={q.image_url} alt="Question" className="w-16 h-16 object-cover rounded-lg border border-zinc-200" referrerPolicy="no-referrer" />
                        )}
                        <label className="flex-1 cursor-pointer">
                          <div className="px-4 py-2 border-2 border-dashed border-zinc-200 rounded-lg text-center text-xs text-zinc-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                            {q.image_url ? 'Change Image' : 'Upload Image'}
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const newQ = [...questions];
                                  newQ[i].image_url = reader.result as string;
                                  setQuestions(newQ);
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                            className="hidden" 
                          />
                        </label>
                        {q.image_url && (
                          <button onClick={() => {
                            const newQ = [...questions];
                            newQ[i].image_url = undefined;
                            setQuestions(newQ);
                          }} className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Type</label>
                      <select 
                        value={q.type} 
                        onChange={e => {
                          const newQ = [...questions];
                          newQ[i].type = e.target.value;
                          setQuestions(newQ);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none"
                      >
                        <option value="theory">Theory</option>
                        <option value="math">Mathematics</option>
                        <option value="practical">Practical (Image)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Marks</label>
                      <input 
                        type="number" 
                        value={q.marks} 
                        onChange={e => {
                          const newQ = [...questions];
                          newQ[i].marks = parseInt(e.target.value);
                          setQuestions(newQ);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none" 
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Marking Scheme / Correct Answer</label>
                  <textarea 
                    value={q.marking_scheme} 
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[i].marking_scheme = e.target.value;
                      setQuestions(newQ);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none h-20" 
                    placeholder="Provide details for AI marking..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-red-500 text-sm font-medium">
            {error && <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</span>}
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">Cancel</button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                loading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-indigo-900/20'
              }`}
            >
              {loading ? 'Saving...' : 'Save Exam'}
            </button>
          </div>
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
    try {
      const results = [];
      const answersToInsert = [];
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const [qId, data] of Object.entries(answers) as [string, any][]) {
        const question = exam.questions.find((q: any) => q.id === parseInt(qId));
        if (!question) continue;

        maxPossibleScore += question.marks;
        let aiResult;

        try {
          if (question.type === 'theory') {
            aiResult = await markTheoryAnswer(question.question_text, question.marking_scheme, data.text || '', question.marks);
          } else if (question.type === 'math') {
            aiResult = await markMathAnswer(question.question_text, question.marking_scheme, data.text || '', question.marks);
          } else if (question.type === 'practical') {
            aiResult = await analyzePracticalImage(question.question_text, data.image || '', data.text || '', question.marks);
          }
        } catch (aiErr) {
          console.error("AI Marking error for question", qId, aiErr);
          aiResult = { score: 0, explanation: "AI marking failed for this question." };
        }

        const score = aiResult?.score || 0;
        const feedback = aiResult?.explanation || aiResult?.analysis || aiResult?.solution || "No feedback provided";
        totalScore += score;

        results.push({ question_id: parseInt(qId), score, feedback });
        answersToInsert.push({
          question_id: parseInt(qId),
          answer_text: data.text || '',
          image_data: data.image || null,
          ai_score: score,
          ai_feedback: feedback
        });
      }

      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      const payload = {
        exam_id: examId,
        totalScore,
        percentage,
        results,
        answersToInsert
      };

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
      } else {
        console.error("Submission failed:", data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) return <div className="flex items-center justify-center h-full dark:text-white">Loading exam...</div>;

  if (results) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto space-y-8 py-12"
      >
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-xl text-center">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Exam Completed!</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Your paper has been marked by our AI system.</p>
          
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="p-8 bg-zinc-50 dark:bg-zinc-800 rounded-3xl">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">Total Score</p>
              <p className="text-5xl font-black text-zinc-900 dark:text-white mt-2">{results.totalScore}</p>
            </div>
            <div className="p-8 bg-indigo-600 text-white rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Percentage</p>
              <p className="text-5xl font-black mt-2">{Math.round(results.percentage)}%</p>
            </div>
          </div>

          <button 
            onClick={onFinish}
            className="mt-12 w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Detailed Feedback</h2>
          {results?.results?.map((res: any, i: number) => {
            const q = exam.questions.find((q: any) => q.id === res.question_id);
            return (
              <div key={res.question_id} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase">Question {i + 1}</span>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                    Score: {res.score}/{q.marks}
                  </span>
                </div>
                <p className="text-lg font-medium text-zinc-900 dark:text-white">{q.question_text}</p>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-2">AI Analysis</p>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{res.feedback}</p>
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
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{exam.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
            <div className="w-48 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500" 
                style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }} 
              />
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-mono font-bold text-xl ${timeLeft < 300 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white'}`}>
          <Clock className="w-6 h-6" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {exam.original_file_url && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Original Exam Document Available</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">You can view the original uploaded file for reference.</p>
            </div>
          </div>
          <a 
            href={exam.original_file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold border border-indigo-200 dark:border-zinc-700 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
          >
            View Original File
          </a>
        </div>
      )}

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

            {currentQuestion.image_url && (
              <div className="mb-8 p-4 bg-zinc-50 rounded-3xl border border-zinc-100 flex justify-center">
                <img 
                  src={currentQuestion.image_url} 
                  alt="Question Illustration" 
                  className="max-w-full h-auto max-h-96 rounded-2xl shadow-sm" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

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
              {exam.questions.map((q: any, i: number) => (
                <button
                  key={q.id || i}
                  disabled={true} // Sequential mode: Disable jumping
                  className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-not-allowed ${
                    currentQuestionIndex === i 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : answers[exam.questions[i].id] 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-zinc-50 text-zinc-400 border border-zinc-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-4 text-center italic">Sequential mode enabled: Please answer questions in order.</p>
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

const ProfilePage = () => {
  const auth = useContext(AuthContext);
  const [name, setName] = useState('');
  const [educationSystem, setEducationSystem] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state with auth user data
  useEffect(() => {
    if (auth?.user) {
      setName(auth.user.name || '');
      setEducationSystem(auth.user.education_system || '');
      setGrade(auth.user.grade || '');
    }
  }, [auth?.user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ name, education_system: educationSystem, grade })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Profile updated successfully!');
        // Update local storage and context
        const updatedUser = { ...auth?.user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        auth?.login(auth.token!, updatedUser);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Profile</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your personal information and academic details.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={auth?.user?.email || ''} 
                disabled
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 cursor-not-allowed outline-none"
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Role</label>
              <input 
                type="text" 
                value={auth?.user?.role || ''} 
                disabled
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 capitalize cursor-not-allowed outline-none"
              />
            </div>
            
            {auth?.user?.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Education System</label>
                  <select 
                    value={educationSystem} 
                    onChange={e => {
                      setEducationSystem(e.target.value);
                      setGrade('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  >
                    <option value="">Select System</option>
                    {EDUCATION_SYSTEMS.map(sys => (
                      <option key={sys} value={sys}>{sys}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Grade</label>
                  <select 
                    value={grade} 
                    onChange={e => setGrade(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                    disabled={!educationSystem}
                  >
                    <option value="">Select Grade</option>
                    {educationSystem && GRADES[educationSystem].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState('dashboard');
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Fetch fresh user data to ensure everything is up to date
      fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(freshUser => {
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      })
      .catch(err => console.error("Failed to refresh user data", err));
    }
  }, []);

  const handleAuth = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    
    // Role-based redirection logic
    // By default we go to dashboard, but we could set specific tabs if needed
    setTab('dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    if (user) {
      const menuItems = [
        { id: 'dashboard', roles: ['admin', 'teacher', 'student', 'developer'] },
        { id: 'exams', roles: ['admin', 'teacher', 'student', 'developer'] },
        { id: 'subjects', roles: ['admin', 'developer'] },
        { id: 'bulk-uploader', roles: ['admin', 'developer'] },
        { id: 'results', roles: ['admin', 'teacher', 'student', 'developer'] },
        { id: 'users', roles: ['admin', 'developer'] },
        { id: 'analytics', roles: ['admin', 'teacher', 'developer'] },
      ];
      const currentItem = menuItems.find(item => item.id === tab);
      if (currentItem && !currentItem.roles.includes(user.role)) {
        setTab('dashboard');
      }
    }
  }, [tab, user]);

  if (!token) {
    return (
      <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        <LoginPage onAuth={handleAuth} />
      </ThemeContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login: handleAuth, logout }}>
      <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors">
          <Navbar />
          <div className="flex">
            <Sidebar currentTab={tab} setTab={setTab} />
            <main className="flex-1 p-8 max-h-[calc(100vh-73px)] overflow-y-auto bg-white dark:bg-zinc-950">
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
                    {tab === 'profile' && <ProfilePage />}
                    {tab === 'subjects' && <SubjectManager />}
                    {tab === 'bulk-uploader' && <BulkExamUploader />}
                    {tab === 'results' && <Results />}
                    {tab === 'users' && <UsersList />}
                    {tab === 'analytics' && <AnalyticsDashboard />}
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
