import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, EDUCATION_SYSTEMS, GRADES } from '../App';
import { Logo } from '../components/Logo';

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const isRegister = location.pathname === '/register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [educationSystem, setEducationSystem] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Requirements: Register Page must have Full Name, Email, Password, Ed System, Grade
    const body = isRegister 
      ? { name, email, password, role: 'student', education_system: educationSystem, grade } 
      : { email, password };

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();

      if (res.ok) {
        if (isRegister) {
          setSuccess('Registration successful. You can now login.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          auth?.login(data.token, data.user);
          // Role-based routing is handled in App.tsx or here
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError('Connection error: Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors px-6">
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 lg:p-12 shadow-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-center mb-10 text-center">
            <Link to="/" className="mb-6">
              <Logo className="w-20 h-20" />
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white font-display">
              {isRegister ? 'Create your Account' : 'Welcome Back'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              {isRegister 
                ? 'Join thousands of students on Examina AI today.' 
                : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Education System</label>
                  <div className="relative">
                    <select 
                      value={educationSystem} 
                      onChange={e => {
                        setEducationSystem(e.target.value);
                        setGrade('');
                      }}
                      required
                      className="w-full pl-4 pr-10 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                    >
                      <option value="">Select System</option>
                      {EDUCATION_SYSTEMS.map(sys => <option key={sys} value={sys}>{sys}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">Grade</label>
                  <div className="relative">
                    <select 
                      value={grade} 
                      onChange={e => setGrade(e.target.value)}
                      required
                      disabled={!educationSystem}
                      className="w-full pl-4 pr-10 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none disabled:opacity-50 transition-all"
                    >
                      <option value="">Select Grade</option>
                      {educationSystem && GRADES[educationSystem].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm flex items-center gap-3 border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group text-lg"
            >
              {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Login Now')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-zinc-500 dark:text-zinc-400">
              {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
              <Link 
                to={isRegister ? '/login' : '/register'}
                className="text-indigo-600 dark:text-indigo-400 font-bold ml-2 hover:underline"
              >
                {isRegister ? 'Login' : 'Register Now'}
              </Link>
            </p>
            <div className="pt-2">
              <Link to="/" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-medium transition-colors inline-flex items-center gap-2">
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
