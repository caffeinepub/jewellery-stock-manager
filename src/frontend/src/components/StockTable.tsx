import { useState, useMemo } from 'react';
import { JewelleryItem } from '../backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StockTableProps {
  items: JewelleryItem[];
  onSelectionChange?: (selectedCodes: Set<string>) => void;
}

type SortField = 'code' | 'grossWeight' | 'stoneWeight' | 'netWeight' | 'pieces';
type SortDirection = 'asc' | 'desc';

export default function StockTable({ items, onSelectionChange }: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: string | number | bigint = a[sortField];
      let bVal: string | number | bigint = b[sortField];

      // Convert bigint to number for comparison
      if (sortField === 'pieces') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [items, searchTerm, sortField, sortDirection]);

  const handleRowClick = (code: string, event: React.MouseEvent) => {
    // Don't toggle if clicking on checkbox directly
    if ((event.target as HTMLElement).closest('button[role="checkbox"]')) {
      return;
    }

    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      // Check if Ctrl/Cmd key is pressed for multi-select
      if (!event.ctrlKey && !event.metaKey) {
        newSelected.clear();
      }
      newSelected.add(code);
    }
    setSelectedCodes(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleCheckboxChange = (code: string, checked: boolean) => {
    const newSelected = new Set(selectedCodes);
    if (checked) {
      newSelected.add(code);
    } else {
      newSelected.delete(code);
    }
    setSelectedCodes(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allCodes = new Set(filteredAndSortedItems.map((item) => item.code));
      setSelectedCodes(allCodes);
      onSelectionChange?.(allCodes);
    } else {
      setSelectedCodes(new Set());
      onSelectionChange?.(new Set());
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline" />
    );
  };

  const allSelected = filteredAndSortedItems.length > 0 && filteredAndSortedItems.every((item) => selectedCodes.has(item.code));
  const someSelected = filteredAndSortedItems.some((item) => selectedCodes.has(item.code)) && !allSelected;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base rounded-xl shadow-soft"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('code')} className="font-semibold hover:bg-transparent p-0">
                  CODE <SortIcon field="code" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('grossWeight')} className="font-semibold hover:bg-transparent p-0">
                  GW (g) <SortIcon field="grossWeight" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('stoneWeight')} className="font-semibold hover:bg-transparent p-0">
                  SW (g) <SortIcon field="stoneWeight" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('netWeight')} className="font-semibold hover:bg-transparent p-0">
                  NW (g) <SortIcon field="netWeight" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('pieces')} className="font-semibold hover:bg-transparent p-0">
                  PCS <SortIcon field="pieces" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item) => {
                const isSelected = selectedCodes.has(item.code);
                return (
                  <TableRow
                    key={item.code}
                    onClick={(e) => handleRowClick(item.code, e)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary hover:bg-primary/15'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCheckboxChange(item.code, checked as boolean)}
                        aria-label={`Select ${item.code}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono font-medium">{item.code}</TableCell>
                    <TableCell className="text-right">{item.grossWeight.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{item.stoneWeight.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{item.netWeight.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{Number(item.pieces)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
