import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { reportService } from '../services/reportService';
import { StudentReport, SubjectReport } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [subjectReports, setSubjectReports] = useState<SubjectReport[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'students' | 'subjects'>('students');
  const [isLoading, setIsLoading] = useState(true);

  const { error, success } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [stuRes, subRes] = await Promise.all([
          reportService.getStudentsReport(),
          reportService.getSubjectsReport(),
        ]);
        setStudentReports(stuRes.students);
        setSubjectReports(subRes.subjects);
      } catch (err) {
        error('Could not load attendance reports.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportStudentsCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Roll Number,Student Name,Department,Class,Total Lectures,Attended Lectures,Attendance Percentage\n';

    studentReports.forEach((s) => {
      csv += `${s.studentId},"${s.name}","${s.department}","${s.className}",${s.totalSessions},${s.attendedSessions},${s.percentage}%\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Student attendance report exported as CSV.');
  };

  if (isLoading) {
    return <LoadingSpinner text="Computing attendance statistics..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Analytics & Reports</h2>
          <p className="text-sm text-slate-500">
            Automated percentage calculations across all enrolled students and subjects
          </p>
        </div>

        <button
          onClick={handleExportStudentsCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Student Report (CSV)</span>
        </button>
      </div>

      {/* Subject Performance Bar Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Subject Attendance Turnout (%)</h3>
            <p className="text-xs text-slate-400">Average lecture attendance turnout comparison</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Subject Averages</span>
          </span>
        </div>

        <div className="h-64 w-full">
          {subjectReports.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectReports}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#ffffff',
                    border: 'none',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Avg Attendance']}
                />
                <Bar dataKey="averageAttendancePercentage" radius={[8, 8, 0, 0]}>
                  {subjectReports.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.averageAttendancePercentage >= 75 ? '#10b981' : entry.averageAttendancePercentage >= 50 ? '#3b82f6' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No subject data available.
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Table Breakdowns */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveReportTab('students')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeReportTab === 'students' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Attendance Report ({studentReports.length})</span>
            {activeReportTab === 'students' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveReportTab('subjects')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeReportTab === 'subjects' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subject Attendance Report ({subjectReports.length})</span>
            {activeReportTab === 'subjects' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Tab Tables */}
        <div className="p-6">
          {activeReportTab === 'students' ? (
            studentReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                      <th className="pb-3">Roll Number</th>
                      <th className="pb-3">Student Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Class</th>
                      <th className="pb-3">Lectures (Attended/Total)</th>
                      <th className="pb-3 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentReports.map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 font-mono font-bold text-slate-800">{stu.studentId}</td>
                        <td className="py-3.5 font-semibold text-slate-900">{stu.name}</td>
                        <td className="py-3.5 text-slate-600">{stu.department}</td>
                        <td className="py-3.5 text-slate-600">{stu.className}</td>
                        <td className="py-3.5 text-slate-700 font-medium">
                          {stu.attendedSessions} / {stu.totalSessions}
                        </td>
                        <td className="py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                              stu.percentage >= 75
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : stu.percentage >= 50
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {stu.percentage < 75 && <AlertTriangle className="w-3 h-3" />}
                            {stu.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No student records found.</p>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                    <th className="pb-3">Subject Name</th>
                    <th className="pb-3">Subject Code</th>
                    <th className="pb-3">Total Conducted Lectures</th>
                    <th className="pb-3 text-right">Average Turnout Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectReports.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 font-bold text-slate-900">{sub.name}</td>
                      <td className="py-3.5 font-mono text-slate-500 text-xs font-semibold">{sub.code}</td>
                      <td className="py-3.5 text-slate-700 font-medium">{sub.totalSessions} Sessions</td>
                      <td className="py-3.5 text-right">
                        <span className="font-bold text-slate-900">{sub.averageAttendancePercentage}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
