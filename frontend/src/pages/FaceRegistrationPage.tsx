import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  ScanFace,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Layers
} from 'lucide-react';
import { WebcamCapture, WebcamCaptureHandle } from '../components/WebcamCapture';
import { studentService } from '../services/studentService';
import { Student } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

const TOTAL_SAMPLES_NEEDED = 5;

export const FaceRegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const webcamRef = useRef<WebcamCaptureHandle>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [samples, setSamples] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState<{
    valid: boolean;
    message: string;
    facesCount: number;
  }>({
    valid: false,
    message: 'Initializing camera...',
    facesCount: 0,
  });
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);

  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  // Load student info
  useEffect(() => {
    const loadStudent = async () => {
      if (!id) return;
      try {
        const data = await studentService.getStudent(id);
        setStudent(data);
      } catch (err) {
        error('Could not load student information.');
        navigate('/students');
      } finally {
        setIsLoadingStudent(false);
      }
    };
    loadStudent();
  }, [id, navigate]);

  // Periodic frame validation loop for live feedback & bounding boxes (every 800ms)
  useEffect(() => {
    let intervalId: any = null;

    const checkFrame = async () => {
      if (!webcamRef.current) return;
      const frameBase64 = webcamRef.current.captureFrame();
      if (!frameBase64) return;

      try {
        const result = await studentService.validateFaceFrame(frameBase64);
        setLiveFeedback({
          valid: result.valid,
          message: result.message,
          facesCount: result.faces_detected,
        });

        if (result.box) {
          const [x, y, w, h] = result.box;
          const color = result.valid ? '#10b981' : '#f59e0b';
          const label = result.valid ? `${student?.name || 'Student'}` : 'Position Face';
          webcamRef.current.drawBoxes([{ x, y, w, h, color, label }]);
        } else {
          webcamRef.current.clearCanvas();
        }
      } catch (err) {
        // Validation cycle failed silently
      }
    };

    intervalId = setInterval(checkFrame, 800);
    return () => clearInterval(intervalId);
  }, [student]);

  // Capture a single valid sample
  const handleCaptureSample = async () => {
    if (!webcamRef.current) return;
    if (samples.length >= TOTAL_SAMPLES_NEEDED) {
      warning('All 5 face samples have already been collected.');
      return;
    }

    setIsCapturing(true);
    const frame = webcamRef.current.captureFrame();
    if (!frame) {
      error('Could not capture frame from webcam.');
      setIsCapturing(false);
      return;
    }

    try {
      const validation = await studentService.validateFaceFrame(frame);
      if (validation.valid) {
        setSamples((prev) => [...prev, frame]);
        success(`Sample ${samples.length + 1} of ${TOTAL_SAMPLES_NEEDED} captured!`);
      } else {
        warning(validation.message || 'Face not positioned clearly. Try again.');
      }
    } catch (err) {
      error('Failed to validate captured frame.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Reset captured samples
  const handleResetSamples = () => {
    setSamples([]);
  };

  // Save encodings to backend MongoDB
  const handleFinalize = async () => {
    if (!id || samples.length === 0) return;
    setIsFinalizing(true);
    try {
      await studentService.registerFaceSamples(id, samples);
      success(`Facial registration completed for ${student?.name}!`);
      navigate('/students');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to enroll face samples. Please try again.';
      error(msg);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoadingStudent) {
    return <LoadingSpinner text="Loading student profile..." className="min-h-[400px]" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/students')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Directory</span>
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
            {student?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{student?.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                {student?.studentId}
              </span>
              <span>•</span>
              <span>{student?.department}</span>
              <span>•</span>
              <span>{student?.className}</span>
            </div>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-100 px-4 py-2 rounded-2xl">
          <Layers className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs font-semibold text-slate-500">Enrolled Samples</p>
            <p className="text-sm font-bold text-blue-900">
              {samples.length} / {TOTAL_SAMPLES_NEEDED} Completed
            </p>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative">
            <WebcamCapture ref={webcamRef} className="aspect-[4/3] w-full" />

            {/* Live Feedback Banner */}
            <div
              className={`absolute top-4 left-4 right-4 p-3 rounded-xl backdrop-blur-md border text-xs font-semibold flex items-center gap-2 shadow-lg transition-all ${
                liveFeedback.valid
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : liveFeedback.facesCount > 1
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              }`}
            >
              {liveFeedback.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              )}
              <span>{liveFeedback.message}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCaptureSample}
              disabled={isCapturing || samples.length >= TOTAL_SAMPLES_NEEDED}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>
                {isCapturing
                  ? 'Evaluating Sample...'
                  : samples.length >= TOTAL_SAMPLES_NEEDED
                  ? '5 Samples Collected'
                  : `Capture Sample (${samples.length + 1}/${TOTAL_SAMPLES_NEEDED})`}
              </span>
            </button>

            {samples.length > 0 && (
              <button
                onClick={handleResetSamples}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors flex items-center gap-1.5"
                title="Clear and re-capture"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Samples Strip & Enrolling */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Face Sample Gallery</h3>
            <p className="text-xs text-slate-400 mb-4">
              Collecting 5 angles/expressions ensures maximum recognition accuracy.
            </p>

            {/* 5 Slots */}
            <div className="grid grid-cols-5 lg:grid-cols-2 gap-2 mb-4">
              {Array.from({ length: TOTAL_SAMPLES_NEEDED }).map((_, idx) => {
                const sample = samples[idx];
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 flex items-center justify-center relative ${
                      sample
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-dashed border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                  >
                    {sample ? (
                      <>
                        <img src={sample} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleFinalize}
              disabled={samples.length < 1 || isFinalizing}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isFinalizing ? (
                <span>Generating Facial Encodings...</span>
              ) : (
                <>
                  <ScanFace className="w-5 h-5" />
                  <span>Save & Complete Registration</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Encodings are stored as a 128D mathematical vector in MongoDB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
