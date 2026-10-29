import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Camera,
  StopCircle,
  Clock,
  Sparkles,
  BookOpen,
  Calendar
} from 'lucide-react';
import { WebcamCapture, WebcamCaptureHandle } from '../components/WebcamCapture';
import { attendanceService } from '../services/attendanceService';
import { SessionDetail, DetectedPerson } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const AttendanceCameraPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const webcamRef = useRef<WebcamCaptureHandle>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [presentCount, setPresentCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentlyMarked, setRecentlyMarked] = useState<DetectedPerson[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const finishingRef = useRef(false);
  const processingRef = useRef(false);
  const recognitionRequestRef = useRef<Promise<void> | null>(null);

  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return;
      try {
        const data = await attendanceService.getSessionDetail(sessionId);
        setSessionDetail(data);
        setPresentCount(data.session.presentCount || data.records.length);
        setTotalStudents(data.session.totalStudents);
      } catch (err) {
        error('Could not load attendance session details.');
        navigate('/dashboard');
      } finally {
        setIsLoadingSession(false);
      }
    };
    loadSession();

    // Cleanup: Stop camera when leaving this page
    return () => {
      console.log('AttendanceCameraPage unmounting, stopping camera');
      webcamRef.current?.stopCamera();
    };
  }, [sessionId, navigate]);

  // Controlled recognition loop: 1 frame every 1.5 seconds
  useEffect(() => {
    if (!sessionId || isLoadingSession) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (!webcamRef.current || processingRef.current || finishingRef.current) return;

      const frame = webcamRef.current.captureFrame();
      if (!frame) return;

      processingRef.current = true;
      setIsProcessing(true);
      const recognitionRequest = (async () => {
        try {
          const result = await attendanceService.recognizeFrame(sessionId, frame);
          if (!isMounted) return;

          setPresentCount(result.totalPresent);
          setTotalStudents(result.totalStudents);

          // Draw bounding boxes on canvas
          if (webcamRef.current) {
            const boxes = result.persons.map((p) => {
              const [x, y, w, h] = p.box;
              let color = '#ef4444'; // Red for unknown
              let label = 'Unknown Face';

              if (p.matched) {
                color = '#10b981'; // Green for recognized
                label = p.alreadyMarked
                  ? `${p.studentName} (Already Present)`
                  : `✓ ${p.studentName}`;
              }

              return { x, y, w, h, color, label };
            });

            webcamRef.current.drawBoxes(boxes);
          }

          // Add newly recognized students to the live stream ticker
          const newMatches = result.persons.filter((p) => p.matched && p.newlyMarked);
          if (newMatches.length > 0) {
            newMatches.forEach((person) => success(`${person.studentName} marked present`));
            setRecentlyMarked((prev) => {
              const combined = [...newMatches, ...prev];
              // Deduplicate by studentId in stream list
              const unique = Array.from(new Map(combined.map((item) => [item.studentId, item])).values());
              return unique.slice(0, 10);
            });
          }
        } catch (err) {
          // Silent catch for frame processing intervals
        } finally {
          processingRef.current = false;
          if (isMounted) setIsProcessing(false);
        }
      })();

      recognitionRequestRef.current = recognitionRequest;
      try {
        await recognitionRequest;
      } finally {
        if (recognitionRequestRef.current === recognitionRequest) {
          recognitionRequestRef.current = null;
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionId, isLoadingSession]);

  const handleFinishAttendance = async () => {
    if (!sessionId) return;
    finishingRef.current = true;
    setIsFinishing(true);
    try {
      // Stop camera immediately
      webcamRef.current?.stopCamera();

      // Let the last recognition request finish before calculating the result.
      if (recognitionRequestRef.current) {
        await recognitionRequestRef.current;
      }
      
      const finished = await attendanceService.finishSession(sessionId);
      success(`Attendance completed! Total Present: ${finished.presentCount}/${finished.totalStudents}`);
      navigate(`/attendance/result/${sessionId}`);
    } catch (err) {
      error('Failed to finish attendance session.');
    } finally {
      finishingRef.current = false;
      setIsFinishing(false);
    }
  };

  if (isLoadingSession) {
    return <LoadingSpinner text="Connecting to session camera..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Session Top Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{sessionDetail?.session.subjectName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {sessionDetail?.session.date}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Counter Badge & Finish Button */}
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-sm">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Marked Present</p>
              <p className="text-base font-bold text-white leading-none mt-0.5">
                {presentCount} / {totalStudents}
              </p>
            </div>
          </div>

          <button
            onClick={handleFinishAttendance}
            disabled={isFinishing}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <StopCircle className="w-5 h-5" />
            <span>{isFinishing ? 'Finalizing...' : 'Finish Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Main Camera & Recognition Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Feed */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative">
            <WebcamCapture ref={webcamRef} className="aspect-[4/3] w-full" />

            {/* Status Pill */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Face Recognition Active</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Faces are recognized and attendance marked automatically once per student.
          </p>
        </div>

        {/* Right: Live Roll Call Feed */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Live Attendance Feed</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {recentlyMarked.length} Detected
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {recentlyMarked.length > 0 ? (
                recentlyMarked.map((person, idx) => (
                  <div
                    key={`${person.studentId}-${idx}`}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                      person.newlyMarked
                        ? 'bg-emerald-50 border-emerald-200 animate-pulse'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        person.newlyMarked
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{person.studentName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{person.studentId}</p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      person.newlyMarked
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {person.newlyMarked ? '✓ Just Marked' : 'Present'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-slate-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-xs font-medium">Position face towards camera</p>
                  <p className="text-[11px] text-slate-400 mt-1">Recognized students appear here live.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleFinishAttendance}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              End Session & Calculate Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
