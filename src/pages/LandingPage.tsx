import React from 'react';
import { motion } from 'motion/react';
import { 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  Calculator, 
  FlaskConical, 
  GraduationCap, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 font-medium text-indigo-200">
                <Zap className="w-4 h-4" />
                <span>Next Generation EdTech</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                Smart AI-Powered <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Examination System</span>
              </h1>
              <p className="text-xl text-indigo-100/80 mb-10 max-w-xl leading-relaxed">
                Examina AI helps students take exams, get instant marking, and improve learning with cutting-edge artificial intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link to="/register" className="px-8 py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2 group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all">
                  Login to Dashboard
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-indigo-800" />
                  ))}
                </div>
                <p className="text-sm text-indigo-200/60 font-medium">Joined by 10,000+ students nationwide</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2 relative"
            >
              <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                  alt="Students using platform" 
                  className="rounded-[2rem] w-full"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-60" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600 rounded-full blur-[80px] opacity-60" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4">Core Features</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6">Revolutionizing How We <span className="text-indigo-600">Test & Learn</span></h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Our advanced AI models provide instantaneous, detailed feedback for every type of examination question.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'AI Exam Marking', desc: 'Instantaneous grading for multiple choice and structured questions.', icon: BrainCircuit, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { title: 'Theory Evaluation', desc: 'Detailed analysis of long-form answers checking for core concepts.', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { title: 'Step-by-Step Math', desc: 'AI solves and grades mathematics problems showing logical progression.', icon: Calculator, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { title: 'Practical Analysis', desc: 'Upload images of laboratory setups for intelligent visual verification.', icon: FlaskConical, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              { title: 'Instant Results', desc: 'No more waiting weeks for results. Get marked instantly after submission.', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { title: 'Analytics Dashboard', desc: 'Track performance trends and identify areas for improvement.', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`${feature.bg} ${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{feature.title}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white dark:bg-zinc-900 relative overflow-hidden transition-colors">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4">The Process</h2>
              <h3 className="text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-10 leading-tight">Your Journey to <br />Success in <span className="text-indigo-600">4 Simple Steps</span></h3>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Register Account', desc: 'Create your secure profile in minutes.' },
                  { step: '02', title: 'Select System & Grade', desc: 'Customize your experience based on your specific requirements (CBE, KJSEA, etc).' },
                  { step: '03', title: 'Take Exams', desc: 'Attempt real-life examination questions in a timed environment.' },
                  { step: '04', title: 'Get Instant AI Results', desc: 'Receive immediate marking, feedback, and performance analysis.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-3xl font-black text-indigo-100 dark:text-indigo-900/40">{item.step}</span>
                    <div>
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h4>
                      <p className="text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <img 
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop" 
                alt="Mockup" 
                className="rounded-[3rem] shadow-2xl relative z-10"
              />
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Systems Supported */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-12">Supporting Every Academic Journey</h3>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {['CBE', 'KJSEA', 'Examina AI (Secondary)'].map((sys) => (
              <div key={sys} className="px-8 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-lg font-bold text-zinc-700 dark:text-zinc-300">
                {sys}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-zinc-900 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">Trusted by Future Leaders</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'John Doe', role: 'Student, Grade 9', text: 'Examina AI has completely changed how I study. The instant math feedback is like having a tutor 24/7.' },
              { name: 'Jane Smith', role: 'Form 4 Candidate', text: 'The results are so accurate. It helps me identify exactly where I need to focus my revision.' },
              { name: 'Alice Kamau', role: 'Teacher', text: 'A game-changer for student assessment. It saves hours of manual marking while providing deeper insights.' },
            ].map((t, i) => (
              <div key={i} className="p-8 bg-zinc-50 dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-900 italic text-zinc-600 dark:text-zinc-400">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => <Zap key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="mb-6">"{t.text}"</p>
                <div className="not-italic">
                  <p className="font-bold text-zinc-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-indigo-600 rounded-[3rem] p-12 lg:p-20 text-white text-center relative overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">Start Learning Smarter Today</h2>
              <p className="text-indigo-100 text-lg mb-10">Join thousands of students who are already using Examina AI to master their education systems.</p>
              <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all text-lg shadow-xl translate-y-0 hover:-translate-y-1">
                Register for Free Now
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
