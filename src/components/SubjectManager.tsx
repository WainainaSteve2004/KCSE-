import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen,
  Search,
  Hash,
  FileText
} from 'lucide-react';
import { AuthContext } from '../App';

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
}

const SubjectManager = () => {
  const auth = useContext(AuthContext);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubjects(data);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError('Subject Name is required');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/subjects/${editingId}` : '/api/subjects';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Subject ${editingId ? 'updated' : 'added'} successfully!`);
        setFormData({ name: '', code: '', description: '' });
        setShowForm(false);
        setEditingId(null);
        fetchSubjects();
      } else {
        setError(data.error || 'Failed to save subject');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || ''
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject? This may affect existing exams.')) return;

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth?.token}`
        }
      });

      if (res.ok) {
        setSuccess('Subject deleted successfully');
        fetchSubjects();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete subject');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Subject Management</h1>
          <p className="text-zinc-500 mt-1">Create and manage subjects for the KCSE AI platform.</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', code: '', description: '' });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Add Subject'}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editingId ? 'Edit Subject' : 'Add New Subject'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 ml-1">Subject Name *</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 ml-1">Subject Code (Optional)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. MATH-101"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 ml-1">Description (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-zinc-400" />
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the subject..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-zinc-500 font-bold hover:bg-zinc-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex flex-col gap-2 items-end">
            {error && (
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
                {error.includes('column "code" of relation "subjects" does not exist') || error.includes('code') && (
                  <div className="p-4 bg-zinc-900 text-zinc-100 rounded-xl text-[11px] flex flex-col gap-2 shadow-lg border border-zinc-700 max-w-sm">
                    <p className="font-bold text-indigo-400 uppercase tracking-wider">Database Update Required</p>
                    <p>The "subjects" table is missing the "code" and "description" columns. Run this SQL in your Supabase Editor:</p>
                    <pre className="bg-black/50 p-2 rounded border border-zinc-700 font-mono text-indigo-300 select-all overflow-x-auto">
                      {`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code TEXT;\nALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;`}
                    </pre>
                  </div>
                )}
                {error.includes('permission denied') && (
                  <div className="p-4 bg-zinc-900 text-zinc-100 rounded-xl text-[11px] flex flex-col gap-2 shadow-lg border border-zinc-700 max-w-sm">
                    <p className="font-bold text-indigo-400 uppercase tracking-wider">Permission Fix Required</p>
                    <p>The database role doesn't have permission to access the "subjects" table. Run this SQL in your Supabase Editor:</p>
                    <pre className="bg-black/50 p-2 rounded border border-zinc-700 font-mono text-indigo-300 select-all overflow-x-auto">
                      {`GRANT ALL ON subjects TO anon, authenticated, service_role;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {success && (
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">Loading subjects...</td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">No subjects found.</td>
                </tr>
              ) : (
                filteredSubjects.map((subject, i) => (
                  <tr key={subject.id || i} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                          {subject.name.charAt(0)}
                        </div>
                        <span className="font-bold text-zinc-900">{subject.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                        {subject.code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-500 line-clamp-1 max-w-xs">
                        {subject.description || 'No description provided.'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(subject)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(subject.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubjectManager;
