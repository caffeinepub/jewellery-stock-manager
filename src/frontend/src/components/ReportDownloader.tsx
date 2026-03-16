import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";

interface ReportItem {
  [key: string]: string | number | bigint | boolean | null | undefined;
}

interface ReportSection {
  title: string;
  data: ReportItem[];
  columns?: { key: string; label: string }[];
}

interface ReportDownloaderProps {
  data: ReportItem[];
  filename?: string;
  columns?: { key: string; label: string }[];
  /** When provided, generates a multi-section CSV instead of a single flat one */
  sections?: ReportSection[];
}

function rowToCSVLine(row: ReportItem, keys: string[]): string {
  return keys
    .map((k) => {
      const val = row[k];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
    .join(",");
}

function sectionToCSVLines(section: ReportSection): string[] {
  const lines: string[] = [];
  lines.push(`--- ${section.title} ---`);
  if (section.data.length === 0) {
    lines.push("(no data)");
    return lines;
  }
  const keys = section.columns
    ? section.columns.map((c) => c.key)
    : Object.keys(section.data[0]);
  const headers = section.columns ? section.columns.map((c) => c.label) : keys;
  lines.push(headers.join(","));
  for (const row of section.data) {
    lines.push(rowToCSVLine(row, keys));
  }
  return lines;
}

function toCSV(
  data: ReportItem[],
  columns?: { key: string; label: string }[],
): string {
  if (data.length === 0) return "";
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);
  const headers = columns ? columns.map((c) => c.label) : keys;
  const rows = data.map((row) => rowToCSVLine(row, keys));
  return [headers.join(","), ...rows].join("\n");
}

function toMultiSectionCSV(sections: ReportSection[]): string {
  const allLines: string[] = [];
  for (const section of sections) {
    if (allLines.length > 0) allLines.push("", "");
    allLines.push(...sectionToCSVLines(section));
  }
  return allLines.join("\n");
}

function toText(
  data: ReportItem[],
  columns?: { key: string; label: string }[],
): string {
  if (data.length === 0) return "";
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0]);
  const headers = columns ? columns.map((c) => c.label) : keys;
  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        return val === null || val === undefined ? "" : String(val);
      })
      .join("\t"),
  );
  return [headers.join("\t"), ...rows].join("\n");
}

function toMultiSectionText(sections: ReportSection[]): string {
  const allLines: string[] = [];
  for (const section of sections) {
    if (allLines.length > 0) allLines.push("", "");
    allLines.push(`=== ${section.title} ===`);
    if (section.data.length === 0) {
      allLines.push("(no data)");
      continue;
    }
    const keys = section.columns
      ? section.columns.map((c) => c.key)
      : Object.keys(section.data[0]);
    const headers = section.columns
      ? section.columns.map((c) => c.label)
      : keys;
    allLines.push(headers.join("\t"));
    for (const row of section.data) {
      allLines.push(
        keys
          .map((k) => {
            const val = row[k];
            return val === null || val === undefined ? "" : String(val);
          })
          .join("\t"),
      );
    }
  }
  return allLines.join("\n");
}

export default function ReportDownloader({
  data,
  filename = "report",
  columns,
  sections,
}: ReportDownloaderProps) {
  const [open, setOpen] = useState(false);

  const downloadCSV = () => {
    const csv = sections ? toMultiSectionCSV(sections) : toCSV(data, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const downloadText = () => {
    const text = sections
      ? toMultiSectionText(sections)
      : toText(data, columns);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          data-ocid="report.export.open_modal_button"
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={downloadCSV}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-success" />
          <span>{sections ? "Excel (CSV) \u2014 2 pages" : "Excel (CSV)"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={downloadText}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-primary" />
          <span>{sections ? "Text file \u2014 2 pages" : "Text file"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
