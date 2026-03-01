import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportItem {
  [key: string]: string | number | bigint | boolean | null | undefined;
}

interface ReportDownloaderProps {
  data: ReportItem[];
  filename?: string;
  columns?: { key: string; label: string }[];
}

function toCSV(data: ReportItem[], columns?: { key: string; label: string }[]): string {
  if (data.length === 0) return '';
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);
  const headers = columns ? columns.map((c) => c.label) : keys;
  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function toText(data: ReportItem[], columns?: { key: string; label: string }[]): string {
  if (data.length === 0) return '';
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);
  const headers = columns ? columns.map((c) => c.label) : keys;
  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        return val === null || val === undefined ? '' : String(val);
      })
      .join('\t')
  );
  return [headers.join('\t'), ...rows].join('\n');
}

export default function ReportDownloader({
  data,
  filename = 'report',
  columns,
}: ReportDownloaderProps) {
  const [open, setOpen] = useState(false);

  const downloadCSV = () => {
    const csv = toCSV(data, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const downloadText = () => {
    const text = toText(data, columns);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={downloadCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-success" />
          <span>Excel (CSV)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadText} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-primary" />
          <span>Text file</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
