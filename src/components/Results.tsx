import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  Filter, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  ArrowLeft,
  FileText,
  Calculator,
  FlaskConical,
  AlertCircle,
  BrainCircuit
} from 'lucide-react';
import { AuthContext } from '../App';

interface ResultSummary {
  id: string;
  exam_id: string;
  exam_title: string;
  subject_name: string;
  total_score: number;
  percentage: number;
  submitted_at: string;
  feedback: string;
  student_id: string;
  student_name?: string;
}

interface DetailedAnswer {
  id: string;
  question_id: string;
  question_text: string;
  answer_text: string;
  correct_answer: string;
  ai_score: number;
  ai_feedback: string;
  marks: number;
  type: 'theory' | 'math' | 'practical';
  image_url?: string;
}

const Results = () => {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'developer' || auth?.user?.role === 'teacher';
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<{ examId: string, studentId: string } | null>(null);
  const [details, setDetails] = useState<{ summary: ResultSummary, answers: DetailedAnswer[] } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'subject' | 'student'>('date');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/api/results/teacher' : '/api/results/student';
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (examId: string, studentId: string) => {
    setDetailsLoading(true);
    try {
      const url = isAdmin 
        ? `/api/results/${examId}/details?studentId=${studentId}`
        : `/api/results/${examId}/details`;
        
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch details');
      }
      const data = await res.json();
      setDetails(data);
      setSelectedResult({ examId, studentId });
    } catch (error) {
      console.error("Error fetching details:", error);
      alert(error instanceof Error ? error.message : "Failed to load exam details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredResults = results
    .filter(r => 
      (r.exam_title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (r.subject_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (r.student_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      if (sortBy === 'score') return b.percentage - a.percentage;
      if (sortBy === 'subject') return (a.subject_name || "").localeCompare(b.subject_name || "");
      if (sortBy === 'student') return (a.student_name || "").localeCompare(b.student_name || "");
      return 0;
    });

  if (selectedResult && details && details.summary) {
    return (
      <div className="space-y-8">
        <button 
          onClick={() => { setSelectedResult(null); setDetails(null); }}
          className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>

        <header className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4" />
                {details.summary.subject_name}
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{details.summary.exam_title}</h1>
              {isAdmin && (
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                  Student: {details.summary.student_name}
                </p>
              )}
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Completed on {new Date(details.summary.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-700 text-center min-w-[140px]">
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Score</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">{details.summary.total_score}</p>
              </div>
              <div className="bg-indigo-600 p-6 rounded-3xl text-center min-w-[140px] text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Percentage</p>
                <p className="text-3xl font-black">{Math.round(details.summary.percentage)}%</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {isAdmin ? "AI Marker Review & Student Responses" : "Question Breakdown"}
          </h2>
          {details.answers.map((ans, i) => (
            <motion.div 
              key={ans.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">
                      {ans.type === 'theory' && <FileText className="w-4 h-4" />}
                      {ans.type === 'math' && <Calculator className="w-4 h-4" />}
                      {ans.type === 'practical' && <FlaskConical className="w-4 h-4" />}
                      {ans.type}
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    ans.ai_score === ans.marks ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 
                    ans.ai_score > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    Score: {ans.ai_score} / {ans.marks}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                  {ans.question_text}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Student Response</h4>
                    <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 min-h-[100px]">
                      {ans.image_url && (
                        <img src={ans.image_url} className="max-h-40 rounded-lg mb-4 shadow-sm" alt="Student work" />
                      )}
                      <p className="whitespace-pre-wrap">{ans.answer_text || 'No answer provided.'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Correct Answer / Scheme</h4>
                    <div className="p-5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-900 dark:text-indigo-300 min-h-[100px]">
                      <p className="whitespace-pre-wrap">{ans.correct_answer || 'Marking scheme not available.'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-900 dark:bg-black rounded-2xl text-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI Feedback & Grading Decision</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {ans.ai_feedback}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {isAdmin ? "Student Results Management" : "My Exam Results"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin ? "Monitor student performance and audit AI marking in real-time." : "Review your performance and AI-powered feedback."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder={isAdmin ? "Search students or exams..." : "Search exams..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm text-zinc-900 dark:text-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            {([
              'date', 
              'score', 
              'subject',
              ...(isAdmin ? ['student'] : [])
            ] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  sortBy === s ? 'bg-zinc-900 dark:bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-zinc-900 h-48 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-20 rounded-[40px] border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="bg-zinc-50 dark:bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">No results found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            {isAdmin ? "No student submissions found yet." : "You haven't completed any exams yet or no results match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result, i) => (
            <motion.div
              key={result.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => fetchDetails(result.exam_id, result.student_id)}
              className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {result.subject_name}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(result.submitted_at).toLocaleDateString()}
                </div>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {result.exam_title}
              </h3>
              {isAdmin && (
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                  Student: {result.student_name}
                </p>
              )}
              
              <div className="flex items-end justify-between mt-8">
                <div>
                  <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Performance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white">{Math.round(result.percentage)}%</span>
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">score</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
