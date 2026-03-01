import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { parseScannerString } from '../utils/scannerParser';
import type { ParsedItem } from '../utils/scannerParser';

interface ExcelUploaderProps {
  onItemsParsed: (items: ParsedItem[]) => void;
  label?: string;
}

declare global {
  interface Window {
    XLSX: any;
  }
}

// Preload XLSX library immediately when module loads
let xlsxLoadPromise: Promise<void> | null = null;

function preloadXLSX(): Promise<void> {
  if (xlsxLoadPromise) return xlsxLoadPromise;
  if (typeof window !== 'undefined' && window.XLSX) {
    xlsxLoadPromise = Promise.resolve();
    return xlsxLoadPromise;
  }
  xlsxLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load XLSX library'));
    document.head.appendChild(script);
  });
  return xlsxLoadPromise;
}

export default function ExcelUploader({ onItemsParsed, label }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xlsxReady, setXlsxReady] = useState(!!(typeof window !== 'undefined' && window.XLSX));

  // Preload XLSX on mount
  useEffect(() => {
    preloadXLSX()
      .then(() => setXlsxReady(true))
      .catch(() => {
        // Will retry on file selection
      });
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Ensure XLSX is loaded
      if (!window.XLSX) {
        await preloadXLSX();
      }

      const XLSX = window.XLSX;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: '',
      });

      const parsedItems: ParsedItem[] = [];

      for (const row of rawData) {
        for (const cell of row) {
          const cellStr = String(cell).trim();
          if (!cellStr) continue;
          const result = parseScannerString(cellStr);
          if (result.status !== 'INVALID') {
            parsedItems.push(result);
          }
        }
      }

      if (parsedItems.length === 0) {
        setError('No valid jewellery items found in the file.');
      } else {
        onItemsParsed(parsedItems);
      }
    } catch (err) {
      setError('Failed to parse file. Please check the format.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [onItemsParsed]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer',
          'transition-all duration-200 group',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-secondary/50',
          isProcessing ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isProcessing ? (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Processing file…</p>
                <p className="text-xs text-muted-foreground mt-0.5">Parsing items</p>
              </div>
            </>
          ) : (
            <>
              <div
                className={[
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  isDragging ? 'bg-primary/20' : 'bg-secondary group-hover:bg-primary/10',
                ].join(' ')}
              >
                {isDragging ? (
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {label || 'Upload Excel / CSV'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isDragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                </p>
                {!xlsxReady && (
                  <p className="text-xs text-warning mt-1 flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading parser…
                  </p>
                )}
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
