import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Mail, 
  GraduationCap, 
  Calendar,
  UserCheck,
  UserX,
  MoreVertical,
  Filter
} from 'lucide-react';
import { AuthContext } from '../App';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  education_system: string;
  grade: string;
  created_at: string;
  status?: 'active' | 'inactive';
}

const UsersList = () => {
  const auth = useContext(AuthContext);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">User Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage students, teachers, and platform access.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm text-zinc-900 dark:text-white transition-colors"
            />
          </div>
          <select 
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-zinc-900 dark:text-white transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-8 py-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Education & Grade</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Joined Date</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-zinc-500 dark:text-zinc-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {user.role === 'student' ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-500" />
                            {user.education_system}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.grade}</p>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 dark:text-zinc-500">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
