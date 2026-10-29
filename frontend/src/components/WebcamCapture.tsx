import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  color?: string;
}

export interface WebcamCaptureHandle {
  captureFrame: () => string | null;
  drawBoxes: (boxes: BoundingBox[]) => void;
  clearCanvas: () => void;
  stopCamera: () => void;
}

interface WebcamCaptureProps {
  onCameraReady?: () => void;
  className?: string;
}

export const WebcamCapture = forwardRef<WebcamCaptureHandle, WebcamCaptureProps>(
  ({ onCameraReady, className = '' }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState(false);

    const startCamera = async () => {
      setErrorMsg('');
      setHasPermission(null);
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        console.log('Stream obtained:', stream);

        if (videoRef.current) {
          console.log('Attaching stream to video element');
          videoRef.current.srcObject = stream;

          // Listen for loadedmetadata event
          videoRef.current.onloadedmetadata = async () => {
            console.log('Video metadata loaded:', {
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight
            });
            
            try {
              const playPromise = videoRef.current?.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('Video playback started successfully');
                    setIsStreaming(true);
                    setHasPermission(true);
                    if (onCameraReady) onCameraReady();
                  })
                  .catch((error) => {
                    console.error('Autoplay prevented:', error);
                    setIsStreaming(true);
                    setHasPermission(true);
                    if (onCameraReady) onCameraReady();
                  });
              }
            } catch (err) {
              console.error('Play error:', err);
              setIsStreaming(true);
              setHasPermission(true);
              if (onCameraReady) onCameraReady();
            }
          };

          // Fallback timeout in case onloadedmetadata doesn't fire
          const timeoutId = setTimeout(() => {
            if (hasPermission === null) {
              console.log('Timeout: forcing stream state');
              setIsStreaming(true);
              setHasPermission(true);
              if (onCameraReady) onCameraReady();
              videoRef.current?.play().catch(e => console.error('Play failed:', e));
            }
          }, 2000);

          return () => clearTimeout(timeoutId);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasPermission(false);
        setIsStreaming(false);
        
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera found. Please ensure a webcam is connected and not in use by another application.');
        } else if (err.name === 'NotReadableError') {
          setErrorMsg('Camera is in use by another application. Please close other apps using the camera.');
        } else {
          setErrorMsg('Could not initialize webcam: ' + err.message);
        }
      }
    };

    useEffect(() => {
      startCamera();

      return () => {
        console.log('WebcamCapture component unmounting, cleaning up camera...');
        if (videoRef.current) {
          // Stop playing video
          videoRef.current.pause();
          
          // Stop all media tracks
          if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              console.log('Stopping track:', track.kind);
              track.stop();
            });
          }
          
          // Completely disconnect the stream
          videoRef.current.srcObject = null;
        }
        
        // Reset state
        setIsStreaming(false);
        setHasPermission(null);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      captureFrame: () => {
        if (!videoRef.current || !isStreaming) {
          console.warn('Cannot capture frame: video not ready');
          return null;
        }
        
        const video = videoRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth || 640;
        tempCanvas.height = video.videoHeight || 480;
        
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return null;
        
        try {
          ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          return tempCanvas.toDataURL('image/jpeg', 0.85);
        } catch (err) {
          console.error('Frame capture error:', err);
          return null;
        }
      },

      drawBoxes: (boxes: BoundingBox[]) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sync canvas size with video intrinsic dimensions
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scaleX = canvas.width / (video.videoWidth || 640);
        const scaleY = canvas.height / (video.videoHeight || 480);

        boxes.forEach((b) => {
          const x = b.x * scaleX;
          const y = b.y * scaleY;
          const w = b.w * scaleX;
          const h = b.h * scaleY;
          const color = b.color || '#3b82f6';

          // Box border
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          // Corner highlights
          const cornerLen = 14;
          ctx.lineWidth = 4;
          // Top-left
          ctx.beginPath();
          ctx.moveTo(x, y + cornerLen);
          ctx.lineTo(x, y);
          ctx.lineTo(x + cornerLen, y);
          ctx.stroke();

          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(x, y + h - cornerLen);
          ctx.lineTo(x, y + h);
          ctx.lineTo(x + cornerLen, y + h);
          ctx.stroke();

          // Top-right
          ctx.beginPath();
          ctx.moveTo(x + w - cornerLen, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w, y + cornerLen);
          ctx.stroke();

          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(x + w - cornerLen, y + h);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x + w, y + h - cornerLen);
          ctx.stroke();

          // Label
          if (b.label) {
            ctx.font = 'bold 14px Inter, sans-serif';
            const textMetrics = ctx.measureText(b.label);
            const padX = 8;
            const padY = 4;
            const textH = 18;

            ctx.fillStyle = color;
            ctx.fillRect(x, Math.max(0, y - textH - padY * 2), textMetrics.width + padX * 2, textH + padY * 2);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(b.label, x + padX, Math.max(textH, y - padY));
          }
        });
      },

      clearCanvas: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      },

      stopCamera: () => {
        console.log('Manually stopping camera...');
        if (videoRef.current) {
          videoRef.current.pause();
          
          if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              console.log('Stopping track:', track.kind);
              track.stop();
            });
          }
          
          videoRef.current.srcObject = null;
        }
        
        setIsStreaming(false);
        setHasPermission(null);
      },
    }));

    return (
      <div className={`relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 w-full h-full ${className}`}>
        {/* Live Video Feed - Critical: must have proper display properties */}
        <video
          ref={videoRef}
          autoPlay={true}
          playsInline={true}
          muted={true}
          crossOrigin="anonymous"
          width={640}
          height={480}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            backgroundColor: '#0f172a',
          }}
        />

        {/* Overlay Canvas for Bounding Boxes */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* Loading / Error States */}
        {hasPermission === false && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 mb-3 border border-rose-500/30">
              <CameraOff className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-lg mb-1">Camera Permission Required</h4>
            <p className="text-sm text-slate-300 max-w-sm mb-4">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {hasPermission === null && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
            <Camera className="w-8 h-8 text-blue-400 animate-pulse mb-3" />
            <p className="text-sm text-slate-300 font-medium">Requesting camera access...</p>
            <p className="text-xs text-slate-400 mt-2">Please allow camera permission in the browser prompt</p>
          </div>
        )}
      </div>
    );
  }
);

WebcamCapture.displayName = 'WebcamCapture';
