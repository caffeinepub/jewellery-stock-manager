import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet,
  ImageIcon,
  Package,
  PenLine,
  ScanLine,
} from "lucide-react";
import { useState } from "react";
import { ItemType } from "../backend";
import BarcodeScanner from "../components/BarcodeScanner";
import ExcelUploader from "../components/ExcelUploader";
import ImageOCRUploader from "../components/ImageOCRUploader";
import ManualEntryForm from "../components/ManualEntryForm";
import TransactionPreview from "../components/TransactionPreview";
import TransactionTotalsView from "../components/TransactionTotalsView";
import { useAuth } from "../contexts/AuthContext";
import { useTransactionsByType } from "../hooks/useQueries";
import type { ParsedItem } from "../utils/scannerParser";

export default function Purchases() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [inputTab, setInputTab] = useState("excel");
  const { currentUser } = useAuth();

  const { data: purchaseTransactions } = useTransactionsByType(
    ItemType.purchase,
  );

  const handleConfirm = () => {
    setParsedItems([]);
  };

  const handleCancel = () => {
    setParsedItems([]);
  };

  return (
    <div className="space-y-6">
      {/* Colorful Page Header */}
      <div className="page-header-purchases rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Purchases
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Record jewellery purchase transactions
            </p>
          </div>
        </div>
      </div>

      {parsedItems.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft section-card-amber">
          <TransactionPreview
            items={parsedItems}
            transactionType="purchase"
            staffName={currentUser?.username}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Input Method */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-amber">
            <h2 className="font-display font-semibold text-sm text-foreground mb-4">
              Add Items
            </h2>
            <Tabs value={inputTab} onValueChange={setInputTab}>
              <TabsList className="mb-4 bg-warning/10">
                <TabsTrigger
                  value="excel"
                  className="tab-active-warning gap-2 text-xs text-foreground"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="tab-active-warning gap-2 text-xs text-foreground"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Manual
                </TabsTrigger>
                <TabsTrigger
                  value="scan"
                  className="tab-active-warning gap-2 text-xs text-foreground"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  Scan
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  className="tab-active-warning gap-2 text-xs text-foreground"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image
                </TabsTrigger>
              </TabsList>
              <TabsContent value="excel">
                <ExcelUploader
                  onItemsParsed={setParsedItems}
                  label="Upload Purchases Excel"
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
              <TabsContent value="image">
                <ImageOCRUploader
                  onItemsParsed={setParsedItems}
                  label="Upload or Capture Image"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Transaction History */}
          {purchaseTransactions && purchaseTransactions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-soft section-card-amber">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-6 rounded-full bg-warning" />
                <h2 className="font-display font-semibold text-base text-foreground">
                  Purchase History
                </h2>
              </div>
              <TransactionTotalsView
                transactions={purchaseTransactions}
                title=""
                showReportDownloader
                twoSectionExport
                colorTheme="amber"
                hideCustomer
                showStaffName
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
