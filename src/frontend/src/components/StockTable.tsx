import { useState, useMemo } from 'react';
import { JewelleryItem, ItemType } from '../backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StockTableProps {
  items: JewelleryItem[];
}

type SortField = 'code' | 'grossWeight' | 'stoneWeight' | 'netWeight' | 'pieces';
type SortDirection = 'asc' | 'desc';

export default function StockTable({ items }: StockTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((item) => item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: number | string | bigint = a[sortField];
      let bVal: number | string | bigint = b[sortField];

      // Handle bigint for pieces - convert to number for comparison
      if (sortField === 'pieces') {
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return filtered;
  }, [items, searchTerm, sortField, sortDirection]);

  const getItemTypeBadge = (itemType: ItemType) => {
    switch (itemType) {
      case ItemType.sale:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20">
            Sale
          </Badge>
        );
      case ItemType.purchase:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20">
            Purchase
          </Badge>
        );
      case ItemType.returned:
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20">
            Return
          </Badge>
        );
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button variant="ghost" size="sm" onClick={() => handleSort(field)} className="h-8 px-2 font-semibold">
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? (
          <ArrowUp className="ml-2 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-2 h-3 w-3" />
        )
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by CODE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="code" label="Code" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="grossWeight" label="GW (g)" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="stoneWeight" label="SW (g)" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="netWeight" label="NW (g)" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="pieces" label="PCS" />
              </TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {searchTerm ? 'No items match your search' : 'No items in inventory'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono font-medium">{item.code}</TableCell>
                  <TableCell className="text-right">{item.grossWeight.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{item.stoneWeight.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{item.netWeight.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{Number(item.pieces)}</TableCell>
                  <TableCell>{getItemTypeBadge(item.itemType)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedItems.length} of {items.length} items
      </div>
    </div>
  );
}
