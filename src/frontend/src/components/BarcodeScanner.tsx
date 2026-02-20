import { useQRScanner } from '../qr-code/useQRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, SwitchCamera, Loader2, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
    maxResults: 1,
  });

  // Handle successful scan
  if (qrResults.length > 0 && qrResults[0].data) {
    const scannedData = qrResults[0].data;
    onScanSuccess(scannedData);
  }

  // Check if device is mobile
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isSupported === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Barcode Scanner
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera is not supported on this device or browser.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Barcode Scanner
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Preview */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Overlay for scanning indicator */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-green-500 rounded-lg w-3/4 h-3/4 animate-pulse" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.type === 'permission' && 'Camera permission denied. Please allow camera access.'}
              {error.type === 'not-found' && 'No camera found on this device.'}
              {error.type === 'not-supported' && 'Camera is not supported on this browser.'}
              {error.type === 'unknown' && `Error: ${error.message}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {!isActive && (
            <Button
              onClick={startScanning}
              disabled={!canStartScanning || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Start Scanning'
              )}
            </Button>
          )}
          
          {isActive && (
            <>
              <Button
                onClick={stopScanning}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                Stop Scanning
              </Button>
              
              {isMobile && (
                <Button
                  onClick={switchCamera}
                  disabled={isLoading}
                  variant="outline"
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground text-center">
          {isScanning ? (
            <p>Position the barcode within the frame to scan</p>
          ) : (
            <p>Click "Start Scanning" to begin</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
