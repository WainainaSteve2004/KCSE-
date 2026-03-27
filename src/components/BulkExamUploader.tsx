import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronRight,
  Info,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from "@google/genai";
import { AuthContext, EDUCATION_SYSTEMS, GRADES } from '../App';

interface Question {
  id?: string;
  question_text: string;
  image_url?: string;
  type: 'theory' | 'math' | 'practical';
  marks: number;
  correct_answer: string;
  marking_scheme: string;
}

const BulkExamUploader = () => {
  const auth = useContext(AuthContext);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState('120');
  const [educationSystem, setEducationSystem] = useState(auth?.user?.education_system || '');
  const [grade, setGrade] = useState(auth?.user?.grade || '');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (auth?.user?.education_system) setEducationSystem(auth.user.education_system);
    if (auth?.user?.grade) setGrade(auth.user.grade);
  }, [auth?.user]);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Question | null>(null);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setSubjects(data) : setSubjects([]))
      .catch(() => setSubjects([]));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Store original file as base64 for now (or upload to storage if available)
    const readerForOriginal = new FileReader();
    readerForOriginal.onload = () => {
      setOriginalFileUrl(readerForOriginal.result as string);
    };
    readerForOriginal.readAsDataURL(file);

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(results.data);
        },
        error: (err) => {
          setError(`CSV Parsing Error: ${err.message}`);
          setIsParsing(false);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processParsedData(data);
        } catch (err: any) {
          setError(`Excel Parsing Error: ${err.message}`);
          setIsParsing(false);
        }
      };
      reader.readAsBinaryString(file);
    } else if (['pdf', 'png', 'jpg', 'jpeg', 'docx'].includes(extension || '')) {
      handleAIParsing(file, extension || '');
    } else {
      setError('Unsupported file format. Please upload CSV, Excel, PDF, DOCX, or Image (PNG/JPG).');
      setIsParsing(false);
    }
  };

  const handleAIParsing = async (file: File, extension: string) => {
    setIsParsing(true);
    setError(null);
    setSuccess(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let contentPart: any;

      if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        contentPart = { text: `Extract questions from the following text: \n\n ${result.value}` };
      } else {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(file);
        });

        let mimeType = '';
        if (extension === 'pdf') mimeType = 'application/pdf';
        else if (['png', 'jpg', 'jpeg'].includes(extension)) mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

        contentPart = {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Extract questions from this file. Return a JSON array of questions. Each question must have: question_text (string), type (one of: theory, math, practical), marks (number), correct_answer (string), and marking_scheme (string). Ensure the output is valid JSON." },
              contentPart
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['theory', 'math', 'practical'] },
                marks: { type: Type.NUMBER },
                correct_answer: { type: Type.STRING },
                marking_scheme: { type: Type.STRING }
              },
              required: ['question_text', 'type', 'marks']
            }
          }
        }
      });

      const parsedData = JSON.parse(response.text || '[]');
      processParsedData(parsedData);
    } catch (err: any) {
      setError(`AI Parsing Error: ${err.message}`);
      setIsParsing(false);
    }
  };

  const processParsedData = (data: any[]) => {
    try {
      const parsedQuestions: Question[] = data.map((row, index) => {
        // Map common headers to our schema
        const question_text = row.question_text || row.Question || row.text || '';
        const type = (row.type || row.Type || 'theory').toLowerCase();
        const marks = parseInt(row.marks || row.Marks || '10');
        const correct_answer = row.correct_answer || row.Answer || row.correct || '';
        const marking_scheme = row.marking_scheme || row.Scheme || row.marking || '';

        if (!question_text) {
          throw new Error(`Row ${index + 1} is missing question text.`);
        }

        return {
          question_text,
          type: ['theory', 'math', 'practical'].includes(type) ? type as any : 'theory',
          marks: isNaN(marks) ? 10 : marks,
          correct_answer,
          marking_scheme
        };
      });

      // Detect duplicates
      const uniqueQuestions: Question[] = [];
      const seen = new Set();
      parsedQuestions.forEach(q => {
        if (!seen.has(q.question_text)) {
          uniqueQuestions.push(q);
          seen.add(q.question_text);
        }
      });

      if (uniqueQuestions.length < parsedQuestions.length) {
        setError(`Detected and removed ${parsedQuestions.length - uniqueQuestions.length} duplicate questions.`);
      }

      setQuestions(uniqueQuestions);
      setSuccess(`Successfully parsed ${uniqueQuestions.length} questions.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...questions[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editData) {
      const updated = [...questions];
      updated[editingIndex] = editData;
      setQuestions(updated);
      setEditingIndex(null);
      setEditData(null);
    }
  };

  const handleRemove = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !examTitle || questions.length === 0 || !educationSystem || !grade) {
      setError('Please provide subject, title, education system, grade, and at least one question.');
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify({
          subject_id: selectedSubject,
          title: examTitle,
          duration: parseInt(duration),
          education_system: educationSystem,
          grade: grade,
          original_file_url: originalFileUrl,
          questions
        })
      });

      if (res.ok) {
        setSuccess(`Successfully uploaded exam "${examTitle}" with ${questions.length} questions.`);
        setQuestions([]);
        setExamTitle('');
        setSelectedSubject('');
        setEducationSystem('');
        setGrade('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to upload exam.');
      }
    } catch (err: any) {
      setError(`Upload error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { question_text: 'What is the powerhouse of the cell?', type: 'theory', marks: 5, correct_answer: 'Mitochondria', marking_scheme: '1 mark for Mitochondria' },
      { question_text: 'Solve 2x + 5 = 15', type: 'math', marks: 10, correct_answer: 'x = 5', marking_scheme: '2 marks for steps, 8 marks for answer' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "exam_template.xlsx");
  };

  const handleQuestionImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...questions];
      updated[index].image_url = reader.result as string;
      setQuestions(updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Bulk Exam Uploader</h1>
          <p className="text-zinc-500 mt-1">Upload multiple questions at once using CSV or Excel files.</p>
        </div>
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-all text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              Exam Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Subject</label>
                <select 
                  value={selectedSubject} 
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Subject</option>
                  {Array.isArray(subjects) && subjects.map((s, i) => <option key={s.id || i} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Exam Title</label>
                <input 
                  value={examTitle} 
                  onChange={e => setExamTitle(e.target.value)}
                  placeholder="e.g. Biology Paper 1 2025"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Duration (minutes)</label>
                <input 
                  type="number"
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Education System</label>
                <select 
                  value={educationSystem} 
                  onChange={e => {
                    setEducationSystem(e.target.value);
                    setGrade('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                  disabled={!educationSystem}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50"
                >
                  <option value="">Select Grade</option>
                  {educationSystem && GRADES[educationSystem].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {originalFileUrl && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Original Document Attached</span>
                </div>
                <button onClick={() => setOriginalFileUrl(null)} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100">
              <label className="block w-full cursor-pointer">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                  <Upload className="w-10 h-10 text-zinc-300 group-hover:text-indigo-500 mb-4 transition-colors" />
                  <span className="text-sm font-bold text-zinc-600 group-hover:text-indigo-600">Click to upload file</span>
                  <span className="text-xs text-zinc-400 mt-1">CSV, Excel, PDF, DOCX, or Images</span>
                </div>
                <input type="file" accept=".csv,.xlsx,.xls,.pdf,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {questions.length > 0 && (
              <button 
                onClick={handleSubmit}
                disabled={isParsing}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isParsing ? 'Uploading...' : 'Finalize & Upload Exam'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-auto">✕</button>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 font-medium">{success}</p>
                <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 ml-auto">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-lg font-bold text-zinc-900">Question Preview ({questions.length})</h2>
              {questions.length > 0 && (
                <button 
                  onClick={() => setQuestions([])}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            <div className="divide-y divide-zinc-100">
              {questions.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-zinc-200" />
                  </div>
                  <p className="text-zinc-400 font-medium">No questions parsed yet. Upload a file to see preview.</p>
                </div>
              ) : (
                questions.map((q, index) => (
                  <div key={q.id || index} className="p-6 hover:bg-zinc-50/50 transition-colors group">
                    {editingIndex === index ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Type</label>
                            <select 
                              value={editData?.type} 
                              onChange={e => setEditData({ ...editData!, type: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="theory">Theory</option>
                              <option value="math">Math</option>
                              <option value="practical">Practical</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Marks</label>
                            <input 
                              type="number"
                              value={editData?.marks} 
                              onChange={e => setEditData({ ...editData!, marks: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Question Text</label>
                          <textarea 
                            value={editData?.question_text} 
                            onChange={e => setEditData({ ...editData!, question_text: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Question Image (Optional)</label>
                          <div className="flex items-center gap-4">
                            {editData?.image_url && (
                              <img src={editData.image_url} alt="Question" className="w-16 h-16 object-cover rounded-lg border border-zinc-200" referrerPolicy="no-referrer" />
                            )}
                            <label className="flex-1 cursor-pointer">
                              <div className="px-4 py-2 border-2 border-dashed border-zinc-200 rounded-lg text-center text-xs text-zinc-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                                {editData?.image_url ? 'Change Image' : 'Upload Image'}
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => setEditData({ ...editData!, image_url: reader.result as string });
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                                className="hidden" 
                              />
                            </label>
                            {editData?.image_url && (
                              <button onClick={() => setEditData({ ...editData!, image_url: undefined })} className="text-red-500 hover:text-red-600">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Correct Answer</label>
                            <input 
                              value={editData?.correct_answer} 
                              onChange={e => setEditData({ ...editData!, correct_answer: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Marking Scheme</label>
                            <input 
                              value={editData?.marking_scheme} 
                              onChange={e => setEditData({ ...editData!, marking_scheme: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingIndex(null)} className="px-4 py-2 text-zinc-500 text-sm font-bold hover:bg-zinc-100 rounded-lg">Cancel</button>
                          <button onClick={handleSaveEdit} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              {q.type}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {q.marks} Marks
                            </span>
                          </div>
                          <p className="text-zinc-900 font-medium leading-relaxed">{q.question_text}</p>
                          {q.image_url && (
                            <div className="mt-2">
                              <img src={q.image_url} alt="Question" className="max-w-full h-auto max-h-48 rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-zinc-400"><span className="font-bold text-zinc-500">Ans:</span> {q.correct_answer || 'N/A'}</span>
                            <span className="text-zinc-400"><span className="font-bold text-zinc-500">Scheme:</span> {q.marking_scheme || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(index)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemove(index)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkExamUploader;
