import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { AuthContext, ThemeContext } from '../App';
import { Logo } from './Logo';

const Navigation = () => {
  const auth = useContext(AuthContext);
  const theme = useContext(ThemeContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard && auth?.user) return null; // Dashboard has its own navbar in the refactored App.tsx

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed w-full z-[100] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/">
          <Logo className="w-12 h-12" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`font-medium transition-colors ${
                location.pathname === link.path 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={theme?.toggleDarkMode}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-500 dark:text-zinc-400"
          >
            {theme?.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {auth?.user ? (
            <Link 
              to="/dashboard" 
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="font-bold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 text-zinc-900 dark:text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-lg font-medium ${
                  location.pathname === link.path ? 'text-indigo-600' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {auth?.user ? (
              <Link 
                to="/dashboard" 
                onClick={() => setIsOpen(false)}
                className="w-full py-4 bg-indigo-600 text-white text-center rounded-xl font-bold"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full py-4 text-center font-bold text-zinc-600 dark:text-zinc-400">Login</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="w-full py-4 bg-indigo-600 text-white text-center rounded-xl font-bold">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
