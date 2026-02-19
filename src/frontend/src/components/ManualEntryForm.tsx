import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedItem } from '../utils/scannerParser';

interface ManualEntryFormProps {
  onEntryAdded: (item: ParsedItem) => void;
}

export default function ManualEntryForm({ onEntryAdded }: ManualEntryFormProps) {
  const [code, setCode] = useState('');
  const [gw, setGw] = useState('');
  const [sw, setSw] = useState('');
  const [nw, setNw] = useState('');
  const [pcs, setPcs] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const grossWeight = parseFloat(gw);
    const stoneWeight = parseFloat(sw);
    const netWeight = parseFloat(nw);
    const pieces = parseInt(pcs, 10);

    // Validation
    if (!code.trim()) {
      toast.error('CODE is required');
      return;
    }

    if (isNaN(grossWeight) || isNaN(stoneWeight) || isNaN(netWeight) || isNaN(pieces)) {
      toast.error('All weight and piece values must be valid numbers');
      return;
    }

    if (grossWeight < 0 || stoneWeight < 0 || netWeight < 0 || pieces < 0) {
      toast.error('Values cannot be negative');
      return;
    }

    // Validate GW = SW + NW equation (with tolerance)
    const tolerance = 0.01;
    const calculatedGW = stoneWeight + netWeight;
    const isValid = Math.abs(grossWeight - calculatedGW) <= tolerance;

    const item: ParsedItem = {
      code: code.trim(),
      grossWeight,
      stoneWeight,
      netWeight,
      pieces,
      status: isValid ? 'VALID' : 'MISTAKE',
      error: isValid ? undefined : `GW (${grossWeight.toFixed(3)}) ≠ SW + NW (${calculatedGW.toFixed(3)})`,
    };

    onEntryAdded(item);
    toast.success('Item added to preview');

    // Reset form
    setCode('');
    setGw('');
    setSw('');
    setNw('');
    setPcs('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="code">CODE</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., NKST-1170"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gw">GW (g)</Label>
          <Input
            id="gw"
            type="number"
            step="0.001"
            value={gw}
            onChange={(e) => setGw(e.target.value)}
            placeholder="0.000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sw">SW (g)</Label>
          <Input
            id="sw"
            type="number"
            step="0.001"
            value={sw}
            onChange={(e) => setSw(e.target.value)}
            placeholder="0.000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nw">NW (g)</Label>
          <Input
            id="nw"
            type="number"
            step="0.001"
            value={nw}
            onChange={(e) => setNw(e.target.value)}
            placeholder="0.000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pcs">PCS</Label>
          <Input
            id="pcs"
            type="number"
            value={pcs}
            onChange={(e) => setPcs(e.target.value)}
            placeholder="1"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full md:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </form>
  );
}
