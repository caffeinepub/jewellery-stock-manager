import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Camera,
  CameraOff,
  RotateCcw,
  ScanLine,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQRScanner } from "../qr-code/useQRScanner";
import { parseScannerString } from "../utils/scannerParser";
import type { ParsedItem } from "../utils/scannerParser";

interface BarcodeScannerProps {
  onBatchReady: (items: ParsedItem[]) => void;
}

const isMobile =
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

export default function BarcodeScanner({ onBatchReady }: BarcodeScannerProps) {
  const [scannedItems, setScannedItems] = useState<ParsedItem[]>([]);
  const [flashGreen, setFlashGreen] = useState(false);

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
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 20,
  });

  useEffect(() => {
    if (qrResults.length > 0) {
      const latest = qrResults[0];
      const parsed = parseScannerString(latest.data);
      if (parsed.status !== "INVALID") {
        setScannedItems((prev) => [...prev, parsed]);
        setFlashGreen(true);
        setTimeout(() => setFlashGreen(false), 600);
        clearResults();
      }
    }
  }, [qrResults, clearResults]);

  const handleReviewAndSubmit = () => {
    if (scannedItems.length === 0) return;
    onBatchReady(scannedItems);
    setScannedItems([]);
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (isSupported === false) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
        <p className="text-sm text-destructive">
          Camera not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Camera Preview */}
      <div
        className={`relative rounded-xl overflow-hidden bg-secondary border-2 transition-colors duration-300 ${
          flashGreen ? "border-success" : "border-border"
        }`}
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

        {/* Count badge */}
        {isActive && scannedItems.length > 0 && (
          <div className="absolute top-2 right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            {scannedItems.length} scanned
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

      {/* Scanned items list */}
      {scannedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {scannedItems.length} item{scannedItems.length !== 1 ? "s" : ""}{" "}
              scanned
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScannedItems([])}
              className="text-destructive hover:text-destructive gap-1 text-xs h-7"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {scannedItems.map((item, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: scan list is ephemeral and reorder-safe
                key={`scan-${idx}`}
                className="flex items-center justify-between px-3 py-2 bg-card text-xs"
              >
                <span className="font-mono font-semibold text-foreground">
                  {item.code}
                </span>
                <span className="text-muted-foreground">
                  GW: {(item.grossWeight ?? 0).toFixed(3)}g
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleReviewAndSubmit}
            className="w-full gap-2"
            data-ocid="scanner.submit_button"
          >
            <Send className="w-4 h-4" />
            Review &amp; Submit ({scannedItems.length} item
            {scannedItems.length !== 1 ? "s" : ""})
          </Button>
        </div>
      )}
    </div>
  );
}
