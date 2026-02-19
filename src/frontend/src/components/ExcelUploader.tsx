import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseScannerStrings } from '../utils/scannerParser';
import type { ParsedItem } from '../utils/scannerParser';

interface ExcelUploaderProps {
  onDataParsed: (items: ParsedItem[]) => void;
}

// Type definition for XLSX library
interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: { [key: string]: unknown };
}

interface XLSXUtils {
  sheet_to_json: (sheet: unknown, options?: { header?: number }) => unknown[][];
}

interface XLSXLibrary {
  read: (data: ArrayBuffer, options?: { type?: string }) => XLSXWorkbook;
  utils: XLSXUtils;
}

declare global {
  interface Window {
    XLSX?: XLSXLibrary;
  }
}

export default function ExcelUploader({ onDataParsed }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  const loadXLSXLibrary = useCallback(async (): Promise<XLSXLibrary> => {
    // Check if already loaded
    if (window.XLSX) {
      return window.XLSX;
    }

    setIsLoadingLibrary(true);

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.onload = () => {
        setIsLoadingLibrary(false);
        if (window.XLSX) {
          resolve(window.XLSX);
        } else {
          reject(new Error('Failed to load XLSX library'));
        }
      };
      script.onerror = () => {
        setIsLoadingLibrary(false);
        reject(new Error('Failed to load XLSX library'));
      };
      document.head.appendChild(script);
    });
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);

      try {
        // Load XLSX library if not already loaded
        const XLSX = await loadXLSXLibrary();

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract scanner strings (assuming they're in the first column)
        const scannerStrings: string[] = rawData
          .map((row) => {
            // Try to find a string value in the row
            const value = row.find((cell) => typeof cell === 'string' && cell.trim().length > 0);
            return typeof value === 'string' ? value.trim() : '';
          })
          .filter((str) => str.length > 0);

        if (scannerStrings.length === 0) {
          setError('No data found in the Excel file. Please ensure the file contains scanner strings.');
          setIsProcessing(false);
          return;
        }

        // Parse scanner strings
        const parsedItems = parseScannerStrings(scannerStrings);

        if (parsedItems.length === 0) {
          setError('No valid scanner strings found. Please check the file format.');
          setIsProcessing(false);
          return;
        }

        onDataParsed(parsedItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file');
      } finally {
        setIsProcessing(false);
      }
    },
    [onDataParsed, loadXLSXLibrary]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          processFile(file);
        } else {
          setError('Please upload an Excel file (.xlsx or .xls)');
        }
      }
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

  const isLoading = isProcessing || isLoadingLibrary;

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <>
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground animate-pulse" />
              <div>
                <p className="text-lg font-medium">
                  {isLoadingLibrary ? 'Loading Excel library...' : 'Processing file...'}
                </p>
                <p className="text-sm text-muted-foreground">Please wait while we parse the data</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Button variant="outline" type="button">
                Select File
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
