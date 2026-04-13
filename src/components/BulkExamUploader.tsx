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
  Download,
  BookOpen,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { GoogleGenAI, Type } from "@google/genai";
import { AuthContext, EDUCATION_SYSTEMS, GRADES } from '../App';

interface Question {
  id?: string;
  tempId?: string; // Added for unique keys in UI
  question_text: string;
  image_url?: string;
  type: 'theory' | 'math' | 'practical';
  marks: number;
  correct_answer: string;
  marking_scheme: string;
  subject_name?: string; // Added for multi-subject support
}

interface SubjectMapping {
  [key: string]: string; // file_subject_name -> system_subject_id
}

const BulkExamUploader = () => {
  const auth = useContext(AuthContext);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(''); // Default subject if not in file
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState('120');
  const [educationSystem, setEducationSystem] = useState(auth?.user?.education_system || '');
  const [grade, setGrade] = useState(auth?.user?.grade || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectMappings, setSubjectMappings] = useState<SubjectMapping>({});
  const [detectedSubjects, setDetectedSubjects] = useState<string[]>([]);
  const [uploadSummary, setUploadSummary] = useState<any>(null);

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
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setSubjects(data) : setSubjects([]))
      .catch(() => setSubjects([]));
  }, []);

  const processFile = async (file: File, isRoot = true) => {
    if (isRoot) {
      setIsParsing(true);
      setError(null);
      setSuccess(null);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'zip') {
      try {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const files = Object.values(contents.files).filter(f => !f.dir);
        
        let processedCount = 0;
        for (const zipFile of files) {
          const ext = zipFile.name.split('.').pop()?.toLowerCase();
          if (['csv', 'xlsx', 'xls', 'pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'txt'].includes(ext || '')) {
            const blob = await zipFile.async('blob');
            const extractedFile = new File([blob], zipFile.name);
            await processFile(extractedFile, false);
            processedCount++;
          }
        }
        if (processedCount === 0) {
          setError('No supported files found in the zip archive.');
        } else {
          setSuccess(prev => prev ? `${prev} | Processed zip: ${processedCount} files` : `Successfully processed ${processedCount} files from zip.`);
        }
      } catch (err: any) {
        setError(`Zip Extraction Error: ${err.message}`);
      } finally {
        if (isRoot) setIsParsing(false);
      }
      return;
    }

    // Store original file as base64 for now (or upload to storage if available)
    if (isRoot) {
      const readerForOriginal = new FileReader();
      readerForOriginal.onload = () => {
        setOriginalFileUrl(readerForOriginal.result as string);
      };
      readerForOriginal.readAsDataURL(file);
    }

    try {
      if (extension === 'csv') {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              processParsedData(results.data);
              resolve();
            },
            error: (err) => {
              setError(`CSV Parsing Error: ${err.message}`);
              reject(err);
            }
          });
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);
              processParsedData(data);
              resolve();
            } catch (err: any) {
              setError(`Excel Parsing Error: ${err.message}`);
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsBinaryString(file);
        });
      } else if (extension === 'txt') {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const text = evt.target?.result as string;
            handleAIParsing(file, 'txt', text).then(resolve).catch(reject);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else if (['pdf', 'png', 'jpg', 'jpeg', 'docx', 'webp'].includes(extension || '')) {
        await handleAIParsing(file, extension || '');
      } else {
        setError(`Unsupported file format: .${extension || 'unknown'}. Please upload CSV, Excel, PDF, DOCX, TXT, ZIP, or Image (PNG/JPG/WEBP).`);
      }
    } catch (err) {
      console.error("File processing error:", err);
    } finally {
      if (isRoot) setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAIParsing = async (file: File, extension: string, rawText?: string) => {
    setIsParsing(true);
    setError(null);
    setSuccess(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let contentPart: any;

      if (rawText) {
        contentPart = { text: `Extract questions from the following text: \n\n ${rawText}` };
      } else if (extension === 'docx') {
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
        else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
          mimeType = extension === 'webp' ? 'image/webp' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        }

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
              { text: "Extract questions from this file. Return a JSON array of questions. Each question must have: question_text (string), type (one of: theory, math, practical), marks (number), correct_answer (string), marking_scheme (string), and subject (string, the subject name if mentioned, e.g., 'Mathematics'). Ensure the output is valid JSON." },
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
                marking_scheme: { type: Type.STRING },
                subject: { type: Type.STRING }
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
        const subject_name = row.subject || row.Subject || row.subject_name || '';

        if (!question_text) {
          throw new Error(`Row ${index + 1} is missing question text.`);
        }

        return {
          tempId: Math.random().toString(36).substring(2, 9) + Date.now(),
          question_text,
          type: ['theory', 'math', 'practical'].includes(type) ? type as any : 'theory',
          marks: isNaN(marks) ? 10 : marks,
          correct_answer,
          marking_scheme,
          subject_name: subject_name.trim()
        };
      });

      // Detect unique subjects
      const uniqueSubjects = Array.from(new Set(parsedQuestions.map(q => q.subject_name).filter(Boolean))) as string[];
      setDetectedSubjects(prev => Array.from(new Set([...prev, ...uniqueSubjects])));

      // Auto-map subjects if they match existing ones exactly
      const initialMappings: SubjectMapping = {};
      uniqueSubjects.forEach(s => {
        const match = subjects.find(sub => sub.name.toLowerCase() === s.toLowerCase());
        if (match) initialMappings[s] = match.id;
      });
      setSubjectMappings(prev => ({ ...prev, ...initialMappings }));

      // Detect duplicates and update state
      setQuestions(prev => {
        const all = [...prev, ...parsedQuestions];
        const unique: Question[] = [];
        const seen = new Set();
        all.forEach(q => {
          const key = `${q.subject_name}|${q.question_text}`;
          if (!seen.has(key)) {
            unique.push(q);
            seen.add(key);
          }
        });
        return unique;
      });

      setSuccess(prev => prev ? `${prev} | Parsed ${parsedQuestions.length} questions` : `Successfully parsed ${parsedQuestions.length} questions.`);
    } catch (err: any) {
      setError(err.message);
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
    // Validation
    if (!examTitle || questions.length === 0 || !educationSystem || !grade) {
      setError('Please provide title, education system, grade, and at least one question.');
      return;
    }

    // Check if all subjects are mapped
    const unmapped = detectedSubjects.filter(s => !subjectMappings[s]);
    if (unmapped.length > 0 && detectedSubjects.length > 0) {
      setError(`Please map all subjects: ${unmapped.join(', ')}`);
      return;
    }

    if (detectedSubjects.length === 0 && !selectedSubject) {
      setError('Please select a subject or ensure the file has a subject column.');
      return;
    }

    setIsParsing(true);
    setError(null);
    setUploadSummary(null);

    try {
      // Group questions by subject
      const grouped: Record<string, Question[]> = {};
      if (detectedSubjects.length > 0) {
        questions.forEach(q => {
          const sName = q.subject_name || 'Unspecified';
          if (!grouped[sName]) grouped[sName] = [];
          grouped[sName].push(q);
        });
      } else {
        grouped['default'] = questions;
      }

      const results = [];
      for (const [sName, sQuestions] of Object.entries(grouped)) {
        const sId = sName === 'default' ? selectedSubject : subjectMappings[sName];
        const sRealName = sName === 'default' ? subjects.find(s => s.id === selectedSubject)?.name : sName;

        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth?.token}`
          },
          body: JSON.stringify({
            subject_id: sId,
            title: detectedSubjects.length > 0 ? `${examTitle} - ${sRealName}` : examTitle,
            duration: parseInt(duration),
            education_system: educationSystem,
            grade: grade,
            original_file_url: originalFileUrl,
            questions: sQuestions
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(`Failed to upload ${sRealName}: ${data.error}`);
        }
        results.push({ subject: sRealName, count: sQuestions.length });
      }

      setUploadSummary({
        totalQuestions: questions.length,
        totalSubjects: results.length,
        details: results
      });
      
      setSuccess(`Successfully uploaded ${results.length} exams.`);
      setQuestions([]);
      setDetectedSubjects([]);
      setSubjectMappings({});
      setExamTitle('');
    } catch (err: any) {
      setError(`Upload error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const createSubject = async (name: string) => {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ name, code: name.substring(0, 3).toUpperCase() })
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects([...subjects, data]);
        setSubjectMappings(prev => ({ ...prev, [name]: data.id }));
        setSuccess(`Subject "${name}" created successfully.`);
      } else {
        setError(data.error || 'Failed to create subject');
      }
    } catch (err) {
      setError('Connection error creating subject');
    }
  };

  const downloadTemplate = () => {
    const template = [
      { Subject: 'Mathematics', question_text: 'Solve 2x + 5 = 15', type: 'math', marks: 10, correct_answer: 'x = 5', marking_scheme: '2 marks for steps, 8 marks for answer' },
      { Subject: 'English', question_text: 'What is the powerhouse of the cell?', type: 'theory', marks: 5, correct_answer: 'Mitochondria', marking_scheme: '1 mark for Mitochondria' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "bulk_exam_template.xlsx");
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
    <div 
      className="max-w-6xl mx-auto space-y-8 pb-20"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Bulk Exam Uploader</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Upload multiple questions at once using CSV or Excel files.</p>
        </div>
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Exam Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Base Exam Title</label>
                <input 
                  value={examTitle} 
                  onChange={e => setExamTitle(e.target.value)}
                  placeholder="e.g. End Term 1 2025"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {detectedSubjects.length === 0 ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
                  <select 
                    value={selectedSubject} 
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="">Select Subject</option>
                    {Array.isArray(subjects) && subjects.map((s, i) => <option key={s.id || i} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Subject Mapping</h3>
                  {detectedSubjects.map(sName => (
                    <div key={sName} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{sName}</span>
                        {!subjectMappings[sName] && (
                          <button 
                            onClick={() => createSubject(sName)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Create New
                          </button>
                        )}
                      </div>
                      <select 
                        value={subjectMappings[sName] || ''} 
                        onChange={e => setSubjectMappings({ ...subjectMappings, [sName]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="">Map to Subject...</option>
                        {subjects.map((s, i) => <option key={s.id || `sub-${i}`} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (minutes)</label>
                <input 
                  type="number"
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Education System</label>
                <select 
                  value={educationSystem} 
                  onChange={e => {
                    setEducationSystem(e.target.value);
                    setGrade('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">Select System</option>
                  {EDUCATION_SYSTEMS.map(sys => <option key={sys} value={sys}>{sys}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Grade</label>
                <select 
                  value={grade} 
                  onChange={e => setGrade(e.target.value)}
                  disabled={!educationSystem}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select Grade</option>
                  {educationSystem && GRADES[educationSystem].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {originalFileUrl && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wider">Original Document Attached</span>
                </div>
                <button onClick={() => setOriginalFileUrl(null)} className="text-red-500 hover:text-red-600 dark:hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <label 
                className="block w-full cursor-pointer"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all group ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}`}>
                  <Upload className={`w-10 h-10 mb-4 transition-colors ${isDragging ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-700 group-hover:text-indigo-500'}`} />
                  <span className={`text-sm font-bold transition-colors ${isDragging ? 'text-indigo-600' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600'}`}>
                    {isDragging ? 'Drop file here' : 'Click or drag to upload file'}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">CSV, Excel, PDF, DOCX, TXT, ZIP, or Images</span>
                </div>
                <input type="file" accept=".csv,.xlsx,.xls,.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.zip" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {uploadSummary && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-indigo-900 text-white rounded-3xl shadow-xl space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-lg font-bold">Upload Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <p className="text-xs text-indigo-300 uppercase font-bold">Total Questions</p>
                    <p className="text-2xl font-bold">{uploadSummary.totalQuestions}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <p className="text-xs text-indigo-300 uppercase font-bold">Subjects Detected</p>
                    <p className="text-2xl font-bold">{uploadSummary.totalSubjects}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {uploadSummary.details.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-white/10 last:border-0">
                      <span className="text-indigo-200">{d.subject}</span>
                      <span className="font-bold">{d.count} questions</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setUploadSummary(null)}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                >
                  Dismiss
                </button>
              </motion.div>
            )}

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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Question Preview ({questions.length})</h2>
                {originalFileUrl && (
                  <button 
                    onClick={() => {
                      const win = window.open();
                      if (win) {
                        win.document.write(`<iframe src="${originalFileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Original Document
                  </button>
                )}
              </div>
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

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {questions.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-zinc-200 dark:text-zinc-700" />
                  </div>
                  <p className="text-zinc-400 dark:text-zinc-500 font-medium">No questions parsed yet. Upload a file to see preview.</p>
                </div>
              ) : (
                (Object.entries(
                  questions.reduce((acc, q) => {
                    const s = q.subject_name || 'Unspecified';
                    if (!acc[s]) acc[s] = [];
                    acc[s].push(q);
                    return acc;
                  }, {} as Record<string, Question[]>)
                ) as [string, Question[]][]).map(([subject, subQuestions]) => (
                  <div key={subject} className="space-y-0">
                    <div className="px-6 py-3 bg-zinc-50/80 dark:bg-zinc-800/80 border-y border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                        {subject} ({subQuestions.length})
                      </h3>
                    </div>
                    {subQuestions.map((q, subIndex) => {
                      const index = questions.indexOf(q);
                      return (
                        <div key={q.tempId || q.id || index} className="p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                          {editingIndex === index ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Subject</label>
                                  <input 
                                    value={editData?.subject_name} 
                                    onChange={e => setEditData({ ...editData!, subject_name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Type</label>
                                  <select 
                                    value={editData?.type} 
                                    onChange={e => setEditData({ ...editData!, type: e.target.value as any })}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                  >
                                    <option value="theory">Theory</option>
                                    <option value="math">Math</option>
                                    <option value="practical">Practical</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Marks</label>
                                  <input 
                                    type="number"
                                    value={editData?.marks} 
                                    onChange={e => setEditData({ ...editData!, marks: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Question Text</label>
                                <textarea 
                                  value={editData?.question_text} 
                                  onChange={e => setEditData({ ...editData!, question_text: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors min-h-[80px]"
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
                      );
                    })}
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
