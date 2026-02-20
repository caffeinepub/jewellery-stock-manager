import { useState, useMemo } from 'react';
import { useTransactionsByType } from '../hooks/useQueries';
import { ItemType, TransactionRecord } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import ReportDownloader from './ReportDownloader';
import { useNavigate } from '@tanstack/react-router';

interface TransactionTotalsViewProps {
  transactionType: ItemType;
  filterLabel?: string;
}

export default function TransactionTotalsView({ transactionType, filterLabel }: TransactionTotalsViewProps) {
  const { data: transactions, isLoading } = useTransactionsByType(transactionType);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = transactions;

    if (dateRange.from) {
      const fromTimestamp = BigInt(dateRange.from.getTime() * 1000000);
      filtered = filtered.filter((tx) => tx.timestamp >= fromTimestamp);
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      const toTimestamp = BigInt(toDate.getTime() * 1000000);
      filtered = filtered.filter((tx) => tx.timestamp <= toTimestamp);
    }

    return filtered;
  }, [transactions, dateRange]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TransactionRecord[]> = {};

    filteredTransactions.forEach((tx) => {
      const date = format(new Date(Number(tx.timestamp) / 1000000), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  const toggleGroup = (date: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCustomerClick = (customerName: string | undefined) => {
    if (customerName) {
      navigate({ to: '/customers' });
    }
  };

  const isSaleTransaction = transactionType === ItemType.sale;

  return (
    <div className="space-y-6">
      {/* Date Filter and Download */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl font-display">
              {filterLabel || `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Transactions`}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 shadow-soft">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PP') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 shadow-soft">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'PP') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Clear
                </Button>
              )}
              <ReportDownloader 
                data={filteredTransactions}
                filename={`${transactionType}-report`}
                title={`${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Report`}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transactions List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : sortedDates.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((date) => {
          const dayTransactions = groupedByDate[date];
          const isExpanded = expandedGroups.has(date);
          const totalGW = dayTransactions.reduce((sum, tx) => sum + tx.item.grossWeight, 0);
          const totalPCS = dayTransactions.reduce((sum, tx) => sum + Number(tx.item.pieces), 0);

          return (
            <Card 
              key={date} 
              className={`shadow-soft hover:shadow-medium transition-all duration-200 ${
                isSaleTransaction ? 'border-l-4 border-l-success' : ''
              }`}
            >
              <CardHeader
                className="cursor-pointer hover:bg-muted/30 transition-colors duration-200 rounded-t-xl"
                onClick={() => toggleGroup(date)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-display">{format(new Date(date), 'PPP')}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dayTransactions.length} transactions • {totalGW.toFixed(2)}g • {totalPCS} pcs
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Time</TableHead>
                          <TableHead className="font-semibold">CODE</TableHead>
                          <TableHead className="text-right font-semibold">GW (g)</TableHead>
                          <TableHead className="text-right font-semibold">SW (g)</TableHead>
                          <TableHead className="text-right font-semibold">NW (g)</TableHead>
                          <TableHead className="text-right font-semibold">PCS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayTransactions.map((tx) => (
                          <TableRow 
                            key={Number(tx.id)}
                            className="hover:bg-muted/30 transition-colors duration-200"
                          >
                            <TableCell>{format(new Date(Number(tx.timestamp) / 1000000), 'p')}</TableCell>
                            <TableCell className="font-mono font-medium">{tx.item.code}</TableCell>
                            <TableCell className="text-right">{tx.item.grossWeight.toFixed(3)}</TableCell>
                            <TableCell className="text-right">{tx.item.stoneWeight.toFixed(3)}</TableCell>
                            <TableCell className="text-right">{tx.item.netWeight.toFixed(3)}</TableCell>
                            <TableCell className="text-right">{Number(tx.item.pieces)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
