import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Percent,
  PlusCircle,
  Camera,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { reportService } from '../services/reportService';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reportService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading dashboard metrics..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200 mb-3 border border-white/10">
              <span>Academic Session 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good Morning, {user?.name || 'Administrator'} 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Welcome to the Smart Attendance System. Facial recognition services and database connections are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/students/register')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Student</span>
            </button>
            <button
              onClick={() => navigate('/attendance/start')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Start Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          subtitle="Enrolled active students"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Subjects"
          value={stats?.totalSubjects || 0}
          subtitle="Academic curriculum"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Today's Sessions"
          value={stats?.todaySessions || 0}
          subtitle="Conducted today"
          icon={CalendarCheck}
          color="amber"
        />
        <StatCard
          title="Overall Attendance"
          value={`${stats?.overallAttendancePercentage || 0}%`}
          subtitle="Average across all sessions"
          icon={Percent}
          color="emerald"
          trend={stats?.overallAttendancePercentage ? `${stats.overallAttendancePercentage}% Rate` : undefined}
        />
      </div>

      {/* Analytics & Recent Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Attendance Trends</h3>
              <p className="text-xs text-slate-400">Recent lecture attendance percentages</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Telemetry</span>
            </span>
          </div>

          <div className="h-64 w-full">
            {stats?.attendanceTrend && stats.attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.attendanceTrend}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Attendance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPct)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Clock className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No completed attendance sessions yet.</p>
                <p className="text-xs text-slate-400 mt-1">Start an attendance session to populate trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance Sessions List */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Recent Sessions</h3>
              <button
                onClick={() => navigate('/attendance/history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                stats.recentSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/attendance/result/${s.id}`)}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.subjectName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.date}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700">
                          {s.presentCount} / {s.totalStudents}
                        </span>
                        <p className="text-[11px] text-slate-400 font-medium">Present</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                          s.attendancePercentage >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.attendancePercentage >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.attendancePercentage}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No sessions conducted yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/attendance/start')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Live Camera Roll Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
