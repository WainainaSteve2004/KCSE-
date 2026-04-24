import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import { AuthPage } from './pages/AuthPage';
import DashboardContainer from './pages/DashboardContainer';

// Components
import Navigation from './components/Navigation';
import Footer from './components/Footer';

// --- Types ---
export type Role = 'admin' | 'teacher' | 'student' | 'developer';
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  education_system?: string;
  grade?: string;
}

export const EDUCATION_SYSTEMS = ['Examina AI', 'CBE', 'KJSEA'];
export const GRADES: Record<string, string[]> = {
  'Examina AI': ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
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

// --- Protected Route ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useContext(AuthContext);
  if (!auth?.token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// --- App Content Wrapper to handle path-based layout ---
const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboard && <Navigation />}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <DashboardContainer />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
      setUser(JSON.parse(savedUser));
      
      // Refresh user data if possible
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
      .catch(() => {});
    }
  }, []);

  const login = (t: string, u: User) => {
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

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
