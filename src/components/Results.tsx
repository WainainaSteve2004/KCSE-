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
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [details, setDetails] = useState<{ summary: ResultSummary, answers: DetailedAnswer[] } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'subject'>('date');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/results/student', {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      });
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

  const fetchDetails = async (examId: string) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/results/${examId}/details`, {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      });
      const data = await res.json();
      setDetails(data);
      setSelectedResult(examId);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredResults = results
    .filter(r => 
      r.exam_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      if (sortBy === 'score') return b.percentage - a.percentage;
      if (sortBy === 'subject') return a.subject_name.localeCompare(b.subject_name);
      return 0;
    });

  if (selectedResult && details) {
    return (
      <div className="space-y-8">
        <button 
          onClick={() => { setSelectedResult(null); setDetails(null); }}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>

        <header className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4" />
                {details.summary.subject_name}
              </div>
              <h1 className="text-3xl font-bold text-zinc-900">{details.summary.exam_title}</h1>
              <p className="text-zinc-500 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Completed on {new Date(details.summary.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 text-center min-w-[140px]">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Score</p>
                <p className="text-3xl font-black text-zinc-900">{details.summary.total_score}</p>
              </div>
              <div className="bg-indigo-600 p-6 rounded-3xl text-center min-w-[140px] text-white shadow-xl shadow-indigo-100">
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Percentage</p>
                <p className="text-3xl font-black">{Math.round(details.summary.percentage)}%</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Question Breakdown
          </h2>
          {details.answers.map((ans, i) => (
            <motion.div 
              key={ans.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-zinc-100 text-zinc-500 rounded-lg flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-widest">
                      {ans.type === 'theory' && <FileText className="w-4 h-4" />}
                      {ans.type === 'math' && <Calculator className="w-4 h-4" />}
                      {ans.type === 'practical' && <FlaskConical className="w-4 h-4" />}
                      {ans.type}
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    ans.ai_score === ans.marks ? 'bg-emerald-50 text-emerald-600' : 
                    ans.ai_score > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    Score: {ans.ai_score} / {ans.marks}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 leading-tight">
                  {ans.question_text}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Your Answer</h4>
                    <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-zinc-700 min-h-[100px]">
                      {ans.image_url && (
                        <img src={ans.image_url} className="max-h-40 rounded-lg mb-4 shadow-sm" alt="Student work" />
                      )}
                      <p className="whitespace-pre-wrap">{ans.answer_text || 'No answer provided.'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Correct Answer / Scheme</h4>
                    <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 text-indigo-900 min-h-[100px]">
                      <p className="whitespace-pre-wrap">{ans.correct_answer || 'Marking scheme not available.'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-900 rounded-2xl text-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI Feedback</h4>
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
          <h1 className="text-3xl font-bold text-zinc-900">Exam Results</h1>
          <p className="text-zinc-500 mt-1">Review your performance and AI-powered feedback.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl p-1">
            {(['date', 'score', 'subject'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  sortBy === s ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-50'
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
            <div key={i} className="bg-white h-48 rounded-3xl border border-zinc-200 animate-pulse" />
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-zinc-200 text-center">
          <div className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-zinc-300" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">No results found</h2>
          <p className="text-zinc-500 mt-2">You haven't completed any exams yet or no results match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result, i) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => fetchDetails(result.exam_id)}
              className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {result.subject_name}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(result.submitted_at).toLocaleDateString()}
                </div>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {result.exam_title}
              </h3>
              
              <div className="flex items-end justify-between mt-8">
                <div>
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Performance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-900">{Math.round(result.percentage)}%</span>
                    <span className="text-xs font-bold text-zinc-400">score</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
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
