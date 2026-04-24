import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 pt-20 pb-10 border-t border-zinc-200 dark:border-zinc-900 transition-colors">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">Examina AI</span>
            </Link>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Leading the way in AI-powered educational assessment. Empowering students to achieve their full potential.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-indigo-600 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-indigo-600 transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-indigo-600 transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</Link></li>
              <li><Link to="/features" className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link to="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</Link></li>
              <li><Link to="/login" className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-6">Education Systems</h4>
            <ul className="space-y-4">
              <li className="text-zinc-500 dark:text-zinc-400">Examina AI (High School)</li>
              <li className="text-zinc-500 dark:text-zinc-400">CBE</li>
              <li className="text-zinc-500 dark:text-zinc-400">KJSEA</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-6">Get in Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <Mail className="w-5 h-5 text-indigo-600" />
                support@examina-ai.com
              </li>
              <li className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <Phone className="w-5 h-5 text-indigo-600" />
                +254 700 000 000
              </li>
              <li className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">
            © {new Date().getFullYear()} Examina AI. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-sm text-zinc-500 dark:text-zinc-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
