import { useEffect } from 'react';
import { Camera, CameraOff, RotateCcw, ScanLine, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQRScanner } from '../qr-code/useQRScanner';
import { parseScannerString } from '../utils/scannerParser';
import type { ParsedItem } from '../utils/scannerParser';

interface BarcodeScannerProps {
  onItemScanned: (item: ParsedItem) => void;
}

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

export default function BarcodeScanner({ onItemScanned }: BarcodeScannerProps) {
  const {
    qrResults,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({ facingMode: 'environment', scanInterval: 100, maxResults: 20 });

  useEffect(() => {
    if (qrResults.length > 0) {
      const latest = qrResults[0];
      const parsed = parseScannerString(latest.data);
      if (parsed.status !== 'INVALID') {
        onItemScanned(parsed);
        clearResults();
      }
    }
  }, [qrResults, onItemScanned, clearResults]);

  if (isSupported === false) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
        <p className="text-sm text-destructive">Camera not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Camera Preview */}
      <div
        className="relative rounded-xl overflow-hidden bg-secondary border border-border"
        style={{ minHeight: 240 }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ minHeight: 240 }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/80">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center">
              <CameraOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Camera inactive</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/80">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Starting camera…</p>
          </div>
        )}

        {isActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-primary/60 rounded-lg relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
              <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary/40" />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isActive ? (
          <Button
            onClick={startScanning}
            disabled={!canStartScanning}
            className="flex-1 gap-2"
          >
            <Camera className="w-4 h-4" />
            Start Scanner
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={stopScanning}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            <CameraOff className="w-4 h-4" />
            Stop Scanner
          </Button>
        )}
        {isMobile && isActive && (
          <Button
            variant="outline"
            size="icon"
            onClick={switchCamera}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
