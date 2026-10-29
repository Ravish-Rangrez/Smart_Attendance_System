import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  UserPlus,
  Trash2,
  ScanFace,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Filter
} from 'lucide-react';
import { studentService } from '../services/studentService';
import { Student } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentService.listStudents({ search: search || undefined });
      setStudents(data.students);
    } catch (err) {
      console.error('Failed to load students:', err);
      error('Could not load student records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(studentToDelete.id);
      success(`Student '${studentToDelete.name}' removed successfully.`);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      error('Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Directory</h2>
          <p className="text-sm text-slate-500">
            {students.length} student{students.length === 1 ? '' : 's'} registered in the system
          </p>
        </div>

        <button
          onClick={() => navigate('/students/register')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 subtle-ring"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner text="Fetching student records..." className="py-16" />
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Student Info</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6">Face Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {stu.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{stu.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{stu.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{stu.department}</td>
                    <td className="py-4 px-6 text-slate-600">{stu.className}</td>
                    <td className="py-4 px-6">
                      {stu.hasFaceRegistered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Face Enrolled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Not Enrolled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/students/face-registration/${stu.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                          title="Register or update face samples"
                        >
                          <ScanFace className="w-3.5 h-3.5" />
                          <span>{stu.hasFaceRegistered ? 'Re-enroll' : 'Enroll Face'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(stu);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">No Students Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {search ? 'No student records match your search criteria.' : 'Get started by adding your first student to the system.'}
            </p>
            <button
              onClick={() => navigate('/students/register')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Student Removal"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete student <strong className="text-slate-900">{studentToDelete?.name}</strong> (Roll: {studentToDelete?.studentId})?
          </p>
          <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
            Warning: This action is permanent and will remove all associated facial encodings.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Student'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
