import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet,
  PenLine,
  ScanLine,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ItemType, type JewelleryItem } from "../backend";
import BarcodeScanner from "../components/BarcodeScanner";
import CodeChartTabs from "../components/CodeChartTabs";
import ExcelUploader from "../components/ExcelUploader";
import ManualEntryForm from "../components/ManualEntryForm";
import TransactionPreview from "../components/TransactionPreview";
import TransactionTotalsView from "../components/TransactionTotalsView";
import { useAuth } from "../contexts/AuthContext";
import {
  useAvailableStock,
  useCustomers,
  useTransactionsByType,
} from "../hooks/useQueries";
import type { ParsedItem } from "../utils/scannerParser";

export default function Sales() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerSelectVal, setCustomerSelectVal] = useState("");
  const [inputTab, setInputTab] = useState("excel");
  const { currentUser } = useAuth();

  const { data: stockItems } = useAvailableStock(ItemType.purchase);
  const { data: salesTransactions } = useTransactionsByType(ItemType.sale);
  const { data: customers } = useCustomers();

  const availableStock = stockItems?.filter((i) => !i.isSold) ?? [];
  const existingCustomerNames = (customers ?? []).map((c) => c.name);

  const handleCustomerSelect = (val: string) => {
    setCustomerSelectVal(val);
    if (val === "" || val === "other") {
      setCustomerName("");
    } else {
      setCustomerName(val);
    }
  };

  const handleStockSelected = (selectedItems: JewelleryItem[]) => {
    const mapped: ParsedItem[] = selectedItems.map((item) => ({
      code: item.code,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      netWeight: item.netWeight,
      pieces: Number(item.pieces),
      status: "VALID" as const,
    }));
    setParsedItems(mapped);
  };

  const handleConfirm = () => {
    setParsedItems([]);
    setCustomerName("");
    setCustomerSelectVal("");
  };

  const handleCancel = () => {
    setParsedItems([]);
  };

  return (
    <div className="space-y-6">
      {/* Colorful Page Header */}
      <div className="page-header-sales rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-success" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Sales
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Record jewellery sales transactions
            </p>
          </div>
        </div>
      </div>

      {parsedItems.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft section-card-green">
          <TransactionPreview
            items={parsedItems}
            transactionType="sale"
            customerName={customerName}
            staffName={currentUser?.username}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Customer Name */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-green">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-success" />
              <h2 className="font-display font-semibold text-sm text-foreground">
                Customer
              </h2>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="customer-select"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Customer Name (optional)
              </Label>
              <select
                id="customer-select"
                value={customerSelectVal}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="flex h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-colors"
                data-ocid="sales.select"
              >
                <option value="">— Select customer —</option>
                {existingCustomerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="other">--- New Customer ---</option>
              </select>
              {customerSelectVal === "other" && (
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter new customer name…"
                  className="max-w-sm mt-2 focus-visible:ring-success/50"
                  data-ocid="sales.input"
                />
              )}
            </div>
          </div>

          {/* Input Method */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-green">
            <h2 className="font-display font-semibold text-sm text-foreground mb-4">
              Add Items
            </h2>
            <Tabs value={inputTab} onValueChange={setInputTab}>
              <TabsList className="mb-4 bg-success/10">
                <TabsTrigger
                  value="excel"
                  className="tab-active-success gap-2 text-xs text-foreground"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="tab-active-success gap-2 text-xs text-foreground"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Manual
                </TabsTrigger>
                <TabsTrigger
                  value="scan"
                  className="tab-active-success gap-2 text-xs text-foreground"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  Scan
                </TabsTrigger>
                <TabsTrigger
                  value="stock"
                  className="tab-active-success gap-2 text-xs text-foreground"
                >
                  <Users className="w-3.5 h-3.5" />
                  Stock
                </TabsTrigger>
              </TabsList>
              <TabsContent value="excel">
                <ExcelUploader
                  onItemsParsed={setParsedItems}
                  label="Upload Sales Excel"
                />
              </TabsContent>
              <TabsContent value="manual">
                <ManualEntryForm
                  onItemAdded={(item) => setParsedItems([item])}
                />
              </TabsContent>
              <TabsContent value="scan">
                <BarcodeScanner
                  onBatchReady={(items) => setParsedItems(items)}
                />
              </TabsContent>
              <TabsContent value="stock">
                <CodeChartTabs
                  items={availableStock}
                  onSelectionConfirmed={handleStockSelected}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Transaction History */}
          {salesTransactions && salesTransactions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-green">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-6 rounded-full bg-success" />
                <h2 className="font-display font-semibold text-base text-foreground">
                  Sales History
                </h2>
              </div>
              <TransactionTotalsView
                transactions={salesTransactions}
                title=""
                showReportDownloader
                twoSectionExport
                colorTheme="green"
                showStaffName
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
