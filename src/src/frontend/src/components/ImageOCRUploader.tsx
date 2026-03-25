import { AlertCircle, Camera, ImageIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ParsedItem } from "../utils/scannerParser";
import { parseScannerString } from "../utils/scannerParser";

declare global {
  interface Window {
    Tesseract: any;
  }
}

interface ImageOCRUploaderProps {
  onItemsParsed: (items: ParsedItem[]) => void;
  label?: string;
}

let tesseractLoadPromise: Promise<void> | null = null;

function preloadTesseract(): Promise<void> {
  if (tesseractLoadPromise) return tesseractLoadPromise;
  if (typeof window !== "undefined" && window.Tesseract) {
    tesseractLoadPromise = Promise.resolve();
    return tesseractLoadPromise;
  }
  tesseractLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load OCR engine"));
    document.head.appendChild(script);
  });
  return tesseractLoadPromise;
}

export default function ImageOCRUploader({
  onItemsParsed,
  label,
}: ImageOCRUploaderProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingEngine, setIsLoadingEngine] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tesseractReady, setTesseractReady] = useState(
    !!(typeof window !== "undefined" && window.Tesseract),
  );

  useEffect(() => {
    preloadTesseract()
      .then(() => setTesseractReady(true))
      .catch(() => {});
  }, []);

  const processImage = useCallback(
    async (file: File) => {
      if (!file) return;

      setError(null);
      setProgress(0);

      if (!window.Tesseract) {
        setIsLoadingEngine(true);
        try {
          await preloadTesseract();
          setTesseractReady(true);
        } catch {
          setError(
            "Failed to load OCR engine. Please check your connection and try again.",
          );
          setIsLoadingEngine(false);
          return;
        }
        setIsLoadingEngine(false);
      }

      setIsProcessing(true);

      try {
        const result = await window.Tesseract.recognize(file, "eng", {
          logger: (m: any) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });

        const lines: string[] = result.data.text
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0);

        if (lines.length === 0) {
          setError(
            "No text detected in the image. Please try a clearer photo.",
          );
          setIsProcessing(false);
          return;
        }

        const parsedItems: ParsedItem[] = lines.map((line) => {
          const item = parseScannerString(line);
          item.rawString = line;
          return item;
        });

        onItemsParsed(parsedItems);
      } catch (err) {
        setError(
          "Failed to process image. Please try again with a clearer photo.",
        );
        console.error(err);
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [onItemsParsed],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
      e.target.value = "";
    },
    [processImage],
  );

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 border-border">
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {isLoadingEngine ? (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Loading OCR engine…
              </p>
            </>
          ) : isProcessing ? (
            <>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-warning animate-spin" />
              </div>
              <div className="w-full max-w-xs">
                <p className="text-sm font-medium text-foreground mb-2">
                  Reading image… {progress}%
                </p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-warning h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {label || "Upload or Capture Image"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extract jewellery data from a photo using OCR
                </p>
                {!tesseractReady && (
                  <p className="text-xs text-warning mt-1 flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading OCR engine…
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 hover:bg-warning/20 text-warning font-medium text-sm transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
