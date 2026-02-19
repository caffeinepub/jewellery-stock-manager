import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { ItemType } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedItem } from '../utils/scannerParser';

interface TransactionPreviewProps {
  items: ParsedItem[];
  transactionType: ItemType;
  onComplete: () => void;
  onItemsChange: (items: ParsedItem[]) => void;
  isPurchaseReturn?: boolean;
  isSalesReturn?: boolean;
}

export default function TransactionPreview({
  items,
  transactionType,
  onComplete,
  onItemsChange,
  isPurchaseReturn,
  isSalesReturn,
}: TransactionPreviewProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(items.map((_, i) => i).filter((i) => items[i].status === 'VALID'))
  );
  const [customerName, setCustomerName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ParsedItem>>({});

  const needsCustomerName = transactionType === ItemType.sale || isSalesReturn;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');

      const itemsToProcess = items.filter((item, i) => selectedItems.has(i) && item.status === 'VALID');

      // Create customer if name provided
      if (needsCustomerName && customerName.trim()) {
        try {
          await actor.createCustomer(customerName.trim());
        } catch (error) {
          // Customer might already exist, continue
        }
      }

      // Use batch transaction for better performance
      const batchData: Array<[string, ItemType, bigint]> = [];

      for (const item of itemsToProcess) {
        // Add item first
        await actor.addItem(
          item.code,
          item.grossWeight!,
          item.stoneWeight!,
          item.netWeight!,
          BigInt(item.pieces!),
          transactionType
        );

        // Prepare batch transaction
        batchData.push([item.code, transactionType, BigInt(Date.now() * 1000000)]);
      }

      // Submit batch
      if (batchData.length > 0) {
        await actor.addBatchTransactions(batchData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['availableStock'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['factory'] });
      toast.success(`Successfully processed ${selectedItems.size} items`);
      onComplete();
    },
    onError: (error) => {
      toast.error(`Failed to process transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const toggleItem = (index: number) => {
    const item = items[index];
    if (item.status !== 'VALID') return;

    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const startEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setEditValues({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: item.pieces,
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValues({});
  };

  const saveEdit = (index: number) => {
    const gw = editValues.grossWeight!;
    const sw = editValues.stoneWeight!;
    const nw = editValues.netWeight!;

    // Validate equation
    const tolerance = 0.01;
    const calculatedGW = sw + nw;
    const isValid = Math.abs(gw - calculatedGW) <= tolerance;

    const updatedItem: ParsedItem = {
      code: editValues.code!,
      grossWeight: gw,
      stoneWeight: sw,
      netWeight: nw,
      pieces: editValues.pieces!,
      status: isValid ? 'VALID' : 'MISTAKE',
      error: isValid ? undefined : `GW (${gw.toFixed(3)}) ≠ SW + NW (${calculatedGW.toFixed(3)})`,
    };

    const newItems = [...items];
    newItems[index] = updatedItem;
    onItemsChange(newItems);

    // Update selection if now valid
    if (isValid) {
      const newSelected = new Set(selectedItems);
      newSelected.add(index);
      setSelectedItems(newSelected);
    }

    setEditingIndex(null);
    setEditValues({});
    toast.success('Item updated');
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);

    // Update selection indices
    const newSelected = new Set<number>();
    selectedItems.forEach((i) => {
      if (i < index) {
        newSelected.add(i);
      } else if (i > index) {
        newSelected.add(i - 1);
      }
    });
    setSelectedItems(newSelected);

    toast.success('Item deleted');
  };

  const validItems = items.filter((item) => item.status === 'VALID');
  const mistakeItems = items.filter((item) => item.status === 'MISTAKE');
  const invalidItems = items.filter((item) => item.status === 'INVALID');
  const selectedValidCount = validItems.filter((item) => selectedItems.has(items.indexOf(item))).length;

  const getStatusBadge = (status: ParsedItem['status']) => {
    switch (status) {
      case 'VALID':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            VALID
          </Badge>
        );
      case 'MISTAKE':
        return (
          <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">
            <AlertTriangle className="mr-1 h-3 w-3" />
            MISTAKE
          </Badge>
        );
      case 'INVALID':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            INVALID
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Preview</CardTitle>
        <CardDescription>
          {validItems.length} valid, {mistakeItems.length} mistakes, {invalidItems.length} invalid.
          {selectedValidCount > 0 && ` ${selectedValidCount} selected.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submit Section */}
        <div className="space-y-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          {needsCustomerName && (
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (optional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedValidCount} of {validItems.length} items selected
            </p>
            <Button
              onClick={() => mutation.mutate()}
              disabled={selectedValidCount === 0 || mutation.isPending}
              size="lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Submit ${selectedValidCount} Items`
              )}
            </Button>
          </div>
        </div>

        {/* Items Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">GW (g)</TableHead>
                <TableHead className="text-right">SW (g)</TableHead>
                <TableHead className="text-right">NW (g)</TableHead>
                <TableHead className="text-right">PCS</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const isEditing = editingIndex === index;
                const isSelected = selectedItems.has(index);

                if (isEditing) {
                  return (
                    <TableRow key={index}>
                      <TableCell></TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Input
                          value={editValues.code || ''}
                          onChange={(e) => setEditValues({ ...editValues, code: e.target.value })}
                          className="font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={editValues.grossWeight || ''}
                          onChange={(e) => setEditValues({ ...editValues, grossWeight: parseFloat(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={editValues.stoneWeight || ''}
                          onChange={(e) => setEditValues({ ...editValues, stoneWeight: parseFloat(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={editValues.netWeight || ''}
                          onChange={(e) => setEditValues({ ...editValues, netWeight: parseFloat(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editValues.pieces || ''}
                          onChange={(e) => setEditValues({ ...editValues, pieces: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(index)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow
                    key={index}
                    className={item.status === 'VALID' && isSelected ? 'bg-primary/10' : ''}
                  >
                    <TableCell>
                      {item.status === 'VALID' && (
                        <button onClick={() => toggleItem(index)}>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded border-2 border-muted-foreground" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell className="text-right">{item.grossWeight?.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{item.stoneWeight?.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{item.netWeight?.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{item.pieces}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(item.status === 'MISTAKE' || item.status === 'INVALID') && (
                          <Button size="icon" variant="ghost" onClick={() => startEdit(index)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => deleteItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Error Messages */}
        {items.some((item) => item.error) && (
          <div className="space-y-2">
            {items.map(
              (item, index) =>
                item.error && (
                  <div key={index} className="text-sm text-destructive">
                    {item.code}: {item.error}
                  </div>
                )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
