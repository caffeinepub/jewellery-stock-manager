import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { JewelleryItem, TransactionRecord } from '../backend';
import { toast } from 'sonner';

interface ReportDownloaderProps {
  data: JewelleryItem[] | TransactionRecord[];
  filename: string;
  title: string;
}

export default function ReportDownloader({ data, filename, title }: ReportDownloaderProps) {
  const isTransactionData = (item: any): item is TransactionRecord => {
    return 'transactionType' in item && 'timestamp' in item;
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    try {
      let csvContent = '';

      if (data.length > 0 && isTransactionData(data[0])) {
        // Transaction data
        csvContent = 'Date,Type,CODE,GW (g),SW (g),NW (g),PCS\n';
        (data as TransactionRecord[]).forEach((tx) => {
          const date = new Date(Number(tx.timestamp) / 1000000).toLocaleString();
          csvContent += `"${date}","${tx.transactionType}","${tx.item.code}",${tx.item.grossWeight.toFixed(3)},${tx.item.stoneWeight.toFixed(3)},${tx.item.netWeight.toFixed(3)},${Number(tx.item.pieces)}\n`;
        });
      } else {
        // Stock data
        csvContent = 'CODE,GW (g),SW (g),NW (g),PCS\n';
        (data as JewelleryItem[]).forEach((item) => {
          csvContent += `"${item.code}",${item.grossWeight.toFixed(3)},${item.stoneWeight.toFixed(3)},${item.netWeight.toFixed(3)},${Number(item.pieces)}\n`;
        });
      }

      downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      toast.success('CSV file downloaded successfully! (Open with Excel)');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV file');
    }
  };

  const exportToPDF = () => {
    try {
      let textContent = `${title}\n`;
      textContent += `Generated: ${new Date().toLocaleString()}\n`;
      textContent += '='.repeat(80) + '\n\n';

      if (data.length > 0 && isTransactionData(data[0])) {
        // Transaction data
        textContent += 'Date                     Type        CODE           GW (g)    SW (g)    NW (g)    PCS\n';
        textContent += '-'.repeat(80) + '\n';
        (data as TransactionRecord[]).forEach((tx) => {
          const date = new Date(Number(tx.timestamp) / 1000000).toLocaleString().padEnd(24);
          const type = tx.transactionType.padEnd(11);
          const code = tx.item.code.padEnd(14);
          const gw = tx.item.grossWeight.toFixed(3).padStart(9);
          const sw = tx.item.stoneWeight.toFixed(3).padStart(9);
          const nw = tx.item.netWeight.toFixed(3).padStart(9);
          const pcs = Number(tx.item.pieces).toString().padStart(6);
          textContent += `${date} ${type} ${code} ${gw} ${sw} ${nw} ${pcs}\n`;
        });
      } else {
        // Stock data
        textContent += 'CODE           GW (g)    SW (g)    NW (g)    PCS\n';
        textContent += '-'.repeat(60) + '\n';
        (data as JewelleryItem[]).forEach((item) => {
          const code = item.code.padEnd(14);
          const gw = item.grossWeight.toFixed(3).padStart(9);
          const sw = item.stoneWeight.toFixed(3).padStart(9);
          const nw = item.netWeight.toFixed(3).padStart(9);
          const pcs = Number(item.pieces).toString().padStart(6);
          textContent += `${code} ${gw} ${sw} ${nw} ${pcs}\n`;
        });
      }

      textContent += '\n' + '='.repeat(80) + '\n';
      textContent += `Total Records: ${data.length}\n`;

      downloadFile(textContent, `${filename}.txt`, 'text/plain;charset=utf-8;');
      toast.success('Text report downloaded successfully!');
    } catch (error) {
      console.error('Text export error:', error);
      toast.error('Failed to export text report');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 shadow-soft hover:shadow-medium transition-shadow duration-200">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-success" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-destructive" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
