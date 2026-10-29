import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, Users, Percent, ArrowRight, BookOpen, Clock, Download } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceSession } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await attendanceService.getHistory();
        setSessions(data.sessions);
      } catch (err) {
        error('Could not load attendance session history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Fetching lecture history..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Session Logs</h2>
          <p className="text-sm text-slate-500">
            {sessions.length} session{sessions.length === 1 ? '' : 's'} recorded in database
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Subject & Date</th>
                  <th className="py-4 px-6">Started Time</th>
                  <th className="py-4 px-6">Turnout (Present/Total)</th>
                  <th className="py-4 px-6">Attendance Rate</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <tr
                    key={sess.id}
                    onClick={() => navigate(`/attendance/result/${sess.id}`)}
                    className="hover:bg-slate-50/75 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{sess.subjectName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{sess.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {sess.startedAt ? new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800">
                        {sess.presentCount} / {sess.totalStudents}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          sess.attendancePercentage >= 75
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sess.attendancePercentage >= 50
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sess.attendancePercentage}%
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          sess.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-blue-50 text-blue-700 animate-pulse'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h3 className="font-bold text-slate-700 text-base">No Attendance Records Yet</h3>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              Launch a live attendance camera session to record student roll calls.
            </p>
            <button
              onClick={() => navigate('/attendance/start')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <span>Start First Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
