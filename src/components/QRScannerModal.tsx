import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { X, Camera, Upload, AlertCircle, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (codeOrUrl: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract room code or poll ID from decoded string
  const parsePollCode = (decoded: string): string => {
    try {
      const trimmed = decoded.trim();
      // If it's a URL
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const pollParam =
          url.searchParams.get('poll') ||
          url.searchParams.get('code') ||
          url.searchParams.get('join') ||
          url.searchParams.get('room') ||
          url.searchParams.get('id');
        if (pollParam) return pollParam.toUpperCase();

        const pathMatch = url.pathname.match(/\/(?:poll|vote|p)\/([a-zA-Z0-9_-]+)/);
        if (pathMatch && pathMatch[1]) return pathMatch[1].toUpperCase();
      }

      // If it contains query param style string
      if (trimmed.includes('?')) {
        const query = trimmed.split('?')[1];
        const params = new URLSearchParams(query);
        const pollParam = params.get('poll') || params.get('code') || params.get('join');
        if (pollParam) return pollParam.toUpperCase();
      }

      // If it's raw 6-8 character code
      return trimmed.toUpperCase();
    } catch {
      return decoded.trim().toUpperCase();
    }
  };

  const handleSuccess = (rawText: string) => {
    const parsed = parsePollCode(rawText);
    setScannedResult(parsed);
    setIsScanning(false);
    stopCamera();

    // Brief delay to show feedback checkmark then navigate
    setTimeout(() => {
      onScanSuccess(parsed);
      onClose();
    }, 600);
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setErrorMessage(null);
    setScannedResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setErrorMessage('Camera access is not supported on this browser or device.');
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCamera(true);
        setIsScanning(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('[Camera Access Error]', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. You can allow camera access or upload a QR image below.');
      } else {
        setErrorMessage('Could not initialize camera. Please try uploading a QR image screenshot instead.');
      }
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleSuccess(code.data);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingFile(false);
          setErrorMessage('Could not process image');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingFile(false);
        if (code && code.data) {
          handleSuccess(code.data);
        } else {
          setErrorMessage('No valid QR code found in this image. Please try a clearer screenshot.');
        }
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setErrorMessage('Failed to load image file.');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-400 border border-indigo-500/20">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">Scan to Vote</h3>
              <p className="text-[11px] text-slate-400">Point your camera at a presenter QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center">
          {/* Active video stream */}
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${scannedResult ? 'opacity-40' : 'opacity-100'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Reticle Overlay */}
          {isScanning && !scannedResult && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-12">
              <div className="relative h-48 w-48 rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                {/* Animated laser line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-lg shadow-indigo-500 animate-[bounce_2s_infinite]" />
              </div>
            </div>
          )}

          {/* Success State Overlay */}
          {scannedResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 p-6 text-center backdrop-blur-sm">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
              <h4 className="mt-3 font-display text-base font-bold text-white">QR Code Detected!</h4>
              <p className="mt-1 font-mono text-xl font-black text-emerald-300 tracking-widest">{scannedResult}</p>
              <p className="text-xs text-emerald-200/80 mt-1">Connecting to live audience voting...</p>
            </div>
          )}

          {/* Error / Fallback State */}
          {!isScanning && !scannedResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90">
              <AlertCircle className="h-10 w-10 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 max-w-xs">{errorMessage || 'Camera unavailable'}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer / Alternate Upload Action */}
        <div className="border-t border-slate-800 bg-slate-950/90 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isProcessingFile ? 'Scanning Image...' : 'Upload QR Image / Screenshot'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Works with any PulsePoll QR code displayed on presentations, slides, or shared links.
          </p>
        </div>
      </div>
    </div>
  );
};
