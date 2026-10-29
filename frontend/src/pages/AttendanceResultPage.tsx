import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Users,
  Percent,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { SessionDetail } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const AttendanceResultPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'present' | 'absent'>('present');
  const [isLoading, setIsLoading] = useState(true);

  const { error, success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadResult = async () => {
      if (!sessionId) return;
      try {
        const data = await attendanceService.getSessionDetail(sessionId);
        setSessionDetail(data);
      } catch (err) {
        error('Could not load session attendance summary.');
      } finally {
        setIsLoading(false);
      }
    };
    loadResult();
  }, [sessionId]);

  const handleExportCSV = () => {
    if (!sessionDetail) return;
    const session = sessionDetail.session;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Subject,${session.subjectName}\n`;
    csvContent += `Date,${session.date}\n`;
    csvContent += `Total Students,${session.totalStudents}\n`;
    csvContent += `Present,${session.presentCount}\n`;
    csvContent += `Absent,${session.absentCount}\n`;
    csvContent += `Attendance %,${session.attendancePercentage}%\n\n`;

    csvContent += 'Student Roll Number,Student Name,Department,Class,Status,Marked At\n';

    sessionDetail.records.forEach((r) => {
      csvContent += `${r.studentId},"${r.studentName}","${r.department || ''}","${r.className || ''}",PRESENT,"${r.markedAt || ''}"\n`;
    });

    sessionDetail.absentStudents.forEach((a) => {
      csvContent += `${a.studentId},"${a.studentName}","${a.department || ''}","${a.className || ''}",ABSENT,""\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${session.subjectName}_${session.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Attendance CSV exported successfully.');
  };

  if (isLoading) {
    return <LoadingSpinner text="Compiling attendance roll call..." className="min-h-[400px]" />;
  }

  const session = sessionDetail?.session;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      {/* Hero Outcome Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Attendance Completed</span>
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">{session?.subjectName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {session?.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {session?.startedAt ? new Date(session.startedAt).toLocaleTimeString() : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => navigate('/attendance/start')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-colors"
            >
              <span>New Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Outcome Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Total Enrolled</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{session?.totalStudents}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700">Present Count</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{session?.presentCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
            <p className="text-xs font-semibold text-rose-700">Absent Count</p>
            <p className="text-2xl font-bold text-rose-800 mt-1">{session?.absentCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700">Attendance Rate</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{session?.attendancePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Roll Call Details Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveTab('present')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'present' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Present Students ({sessionDetail?.records.length || 0})</span>
            {activeTab === 'present' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('absent')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'absent' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Absent Students ({sessionDetail?.absentStudents.length || 0})</span>
            {activeTab === 'absent' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Tab Content Table */}
        <div className="p-6">
          {activeTab === 'present' ? (
            sessionDetail?.records && sessionDetail.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
                      <th className="pb-3">Roll Number</th>
                      <th className="pb-3">Student Name</th>
                      <th className="pb-3">Class</th>
                      <th className="pb-3">Marked Time</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionDetail.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono font-bold text-slate-800">{rec.studentId}</td>
                        <td className="py-3 font-semibold text-slate-900">{rec.studentName}</td>
                        <td className="py-3 text-slate-600">{rec.className || 'N/A'}</td>
                        <td className="py-3 text-slate-500 text-xs">
                          {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="py-3 text-right">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                            Present
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No students were marked present.</p>
            )
          ) : sessionDetail?.absentStudents && sessionDetail.absentStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
                    <th className="pb-3">Roll Number</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Class</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessionDetail.absentStudents.map((abs) => (
                    <tr key={abs.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-bold text-slate-800">{abs.studentId}</td>
                      <td className="py-3 font-semibold text-slate-900">{abs.studentName}</td>
                      <td className="py-3 text-slate-600">{abs.department || 'N/A'}</td>
                      <td className="py-3 text-slate-600">{abs.className || 'N/A'}</td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                          Absent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-emerald-600 font-semibold text-center py-8">
              100% Attendance! No students were absent.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
