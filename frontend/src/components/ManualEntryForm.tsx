import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParsedItem } from '../utils/scannerParser';

interface ManualEntryFormProps {
  onItemAdded: (item: ParsedItem) => void;
}

export default function ManualEntryForm({ onItemAdded }: ManualEntryFormProps) {
  const [code, setCode] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [stoneWeight, setStoneWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [pieces, setPieces] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Code is required.');
      return;
    }

    const gw = parseFloat(grossWeight);
    const sw = parseFloat(stoneWeight) || 0;
    const nw = parseFloat(netWeight);
    const pcs = parseInt(pieces) || 1;

    if (isNaN(gw) || gw <= 0) {
      setError('Gross weight must be a positive number.');
      return;
    }
    if (isNaN(nw) || nw <= 0) {
      setError('Net weight must be a positive number.');
      return;
    }
    if (nw > gw) {
      setError('Net weight cannot exceed gross weight.');
      return;
    }

    const item: ParsedItem = {
      code: code.trim().toUpperCase(),
      grossWeight: gw,
      stoneWeight: sw,
      netWeight: nw,
      pieces: pcs,
      status: 'VALID',
    };

    onItemAdded(item);
    setCode('');
    setGrossWeight('');
    setStoneWeight('');
    setNetWeight('');
    setPieces('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label
            htmlFor="code"
            className="text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            Code
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. ABC123"
            className="font-mono uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="gw"
            className="text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            Gross Weight (g)
          </Label>
          <Input
            id="gw"
            type="number"
            step="0.001"
            value={grossWeight}
            onChange={(e) => setGrossWeight(e.target.value)}
            placeholder="0.000"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="sw"
            className="text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            Stone Weight (g)
          </Label>
          <Input
            id="sw"
            type="number"
            step="0.001"
            value={stoneWeight}
            onChange={(e) => setStoneWeight(e.target.value)}
            placeholder="0.000"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="nw"
            className="text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            Net Weight (g)
          </Label>
          <Input
            id="nw"
            type="number"
            step="0.001"
            value={netWeight}
            onChange={(e) => setNetWeight(e.target.value)}
            placeholder="0.000"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="pcs"
            className="text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            Pieces
          </Label>
          <Input
            id="pcs"
            type="number"
            min="1"
            value={pieces}
            onChange={(e) => setPieces(e.target.value)}
            placeholder="1"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Add Item
      </Button>
    </form>
  );
}
