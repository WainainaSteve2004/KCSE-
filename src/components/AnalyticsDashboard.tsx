import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Award,
  BookOpen,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AuthContext } from '../App';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnalyticsData {
  totalStudents: { count: number };
  totalExams: { count: number };
  totalSubmissions: { count: number };
  averageScore: { avg: number };
  performanceBySubject: { name: string; score: number }[];
  participationOverTime: { date: string; count: number }[];
  recentActivity: {
    studentName: string;
    examTitle: string;
    subjectName: string;
    grade: string;
    score: number;
    time: string;
  }[];
  topPerformer: {
    name: string;
    grade: string;
    avg: number;
  } | null;
}

const AnalyticsDashboard = () => {
  const auth = useContext(AuthContext);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const analytics = await res.json();
      
      setData(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Students', value: data?.totalStudents.count || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: '+12%', positive: true },
    { label: 'Exams Created', value: data?.totalExams.count || 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: '+5', positive: true },
    { label: 'Submissions', value: data?.totalSubmissions.count || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: '+24%', positive: true },
    { label: 'Avg. Score', value: `${Math.round(data?.averageScore.avg || 0)}%`, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: '+2.4%', positive: true },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
          <div className="h-80 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Real-time insights into student performance and participation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Participation Rate
            </h3>
            <select className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg text-xs font-bold px-3 py-1.5 outline-none text-zinc-600 dark:text-zinc-400">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.participationOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Subject Performance
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Avg Score %</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.performanceBySubject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="score" 
                  fill="#10b981" 
                  radius={[0, 10, 10, 0]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{activity.studentName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {activity.subjectName} {activity.grade} • {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-900 dark:text-white">{Math.round(activity.score)}%</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${activity.score >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {activity.score >= 50 ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">No recent activity found.</div>
            )}
          </div>
        </div>
        
        <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 flex flex-col justify-between">
          <div>
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black mb-2">Top Performer</h3>
            {data?.topPerformer ? (
              <p className="text-indigo-100 text-sm leading-relaxed">
                <span className="font-bold text-white">{data.topPerformer.name}</span> from <span className="font-bold text-white">{data.topPerformer.grade}</span> has achieved the highest average score of <span className="font-bold text-white">{Math.round(data.topPerformer.avg)}%</span>.
              </p>
            ) : (
              <p className="text-indigo-100 text-sm leading-relaxed">
                No performance data available yet.
              </p>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <button className="text-xs font-bold uppercase tracking-widest bg-white text-indigo-600 px-4 py-2 rounded-xl">
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
