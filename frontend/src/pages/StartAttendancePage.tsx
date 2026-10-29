import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Camera, Users, PlusCircle, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { subjectService } from '../services/subjectService';
import { attendanceService } from '../services/attendanceService';
import { Subject } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const StartAttendancePage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [newSubjModal, setNewSubjModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [isCreatingSubj, setIsCreatingSubj] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.listSubjects();
      setSubjects(data.subjects);
      if (data.subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data.subjects[0].id);
      }
    } catch (err) {
      error('Could not load subjects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleStartSession = async () => {
    if (!selectedSubjectId) {
      error('Please select a subject to start attendance.');
      return;
    }

    setIsStarting(true);
    try {
      const session = await attendanceService.startSession(selectedSubjectId);
      success(`Attendance session initialized for ${session.subjectName}!`);
      navigate(`/attendance/camera/${session.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start attendance session.';
      error(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName || !newSubjCode) return;

    setIsCreatingSubj(true);
    try {
      const created = await subjectService.createSubject({
        name: newSubjName.trim(),
        code: newSubjCode.trim().toUpperCase(),
      });
      success(`Subject '${created.name}' created!`);
      setNewSubjModal(false);
      setNewSubjName('');
      setNewSubjCode('');
      await fetchSubjects();
      setSelectedSubjectId(created.id);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setIsCreatingSubj(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading curriculum subjects..." className="min-h-[400px]" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-100">
            <Camera className="w-3.5 h-3.5" />
            <span>Real-time Facial Recognition Session</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Select Subject for Attendance</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-lg">
            Choose the academic subject to start a real-time webcam facial recognition roll call.
          </p>
        </div>

        <button
          onClick={() => setNewSubjModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map((subj) => {
          const isSelected = selectedSubjectId === subj.id;
          return (
            <div
              key={subj.id}
              onClick={() => setSelectedSubjectId(subj.id)}
              className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base mb-4 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg leading-snug">{subj.name}</h3>
                <p className="text-xs font-mono font-semibold text-slate-400 mt-1">{subj.code}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between text-xs">
                <span className={isSelected ? 'font-bold text-blue-700' : 'text-slate-400'}>
                  {isSelected ? 'Selected' : 'Click to select'}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Launcher Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-slate-900/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Ready to Launch Live Camera</p>
            <p className="text-xs text-slate-400">
              Selected:{' '}
              <strong className="text-blue-300">
                {subjects.find((s) => s.id === selectedSubjectId)?.name || 'None'}
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleStartSession}
          disabled={!selectedSubjectId || isStarting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isStarting ? (
            <span>Initializing Session...</span>
          ) : (
            <>
              <span>Launch Attendance Camera</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Add Subject Modal */}
      <Modal isOpen={newSubjModal} onClose={() => setNewSubjModal(false)} title="Create New Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms"
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 subtle-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Subject Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS201"
              value={newSubjCode}
              onChange={(e) => setNewSubjCode(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono placeholder:font-sans placeholder:text-slate-400 subtle-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewSubjModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingSubj}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {isCreatingSubj ? 'Saving...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
