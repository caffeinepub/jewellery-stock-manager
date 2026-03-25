import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet,
  PenLine,
  RefreshCcw,
  ScanLine,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ItemType } from "../backend";
import BarcodeScanner from "../components/BarcodeScanner";
import ExcelUploader from "../components/ExcelUploader";
import ManualEntryForm from "../components/ManualEntryForm";
import TransactionPreview from "../components/TransactionPreview";
import TransactionTotalsView from "../components/TransactionTotalsView";
import { useAuth } from "../contexts/AuthContext";
import { useCustomers, useTransactionsByType } from "../hooks/useQueries";
import type { ParsedItem } from "../utils/scannerParser";

export default function Returns() {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [returnType, setReturnType] = useState<
    "salesReturn" | "purchaseReturn"
  >("salesReturn");
  const [inputTab, setInputTab] = useState("excel");
  const [salesReturnCustomerSelect, setSalesReturnCustomerSelect] =
    useState("");
  const [salesReturnCustomer, setSalesReturnCustomer] = useState("");

  const { currentUser } = useAuth();
  const { data: customers } = useCustomers();
  const existingCustomerNames = (customers ?? []).map((c) => c.name);

  const { data: salesReturnTransactions } = useTransactionsByType(
    ItemType.salesReturn,
  );
  const { data: purchaseReturnTransactions } = useTransactionsByType(
    ItemType.purchaseReturn,
  );

  const returnTransactions =
    returnType === "salesReturn"
      ? (salesReturnTransactions ?? [])
      : (purchaseReturnTransactions ?? []);

  const handleConfirm = () => {
    setParsedItems([]);
    setSalesReturnCustomer("");
    setSalesReturnCustomerSelect("");
  };

  const handleCancel = () => {
    setParsedItems([]);
  };

  const handleItemAdded = (item: ParsedItem) => {
    setParsedItems((prev) => [...prev, item]);
  };

  const isSalesReturn = returnType === "salesReturn";
  const activeTabClass = isSalesReturn
    ? "tab-active-destructive"
    : "tab-active-primary";

  return (
    <div className="space-y-6">
      {/* Colorful Page Header */}
      <div className="page-header-returns rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <RefreshCcw className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Returns
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Process sales and purchase returns
            </p>
          </div>
        </div>
      </div>

      {/* Return Type Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setReturnType("salesReturn");
            setParsedItems([]);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            returnType === "salesReturn"
              ? "bg-destructive text-white border-destructive shadow-soft"
              : "bg-card text-muted-foreground border-border hover:border-destructive/40"
          }`}
          data-ocid="returns.toggle"
        >
          Sales Return
        </button>
        <button
          type="button"
          onClick={() => {
            setReturnType("purchaseReturn");
            setParsedItems([]);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            returnType === "purchaseReturn"
              ? "bg-primary text-white border-primary shadow-soft"
              : "bg-card text-muted-foreground border-border hover:border-primary/40"
          }`}
          data-ocid="returns.toggle"
        >
          Purchase Return
        </button>
      </div>

      {parsedItems.length > 0 ? (
        <div
          className={`bg-card border border-border rounded-2xl p-6 shadow-soft ${
            isSalesReturn ? "section-card-rose" : "section-card-violet"
          }`}
        >
          <TransactionPreview
            items={parsedItems}
            transactionType={returnType}
            customerName={isSalesReturn ? salesReturnCustomer : undefined}
            staffName={currentUser?.username}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div
          className={`bg-card border border-border rounded-2xl p-5 shadow-soft ${
            isSalesReturn ? "section-card-rose" : "section-card-violet"
          }`}
        >
          {isSalesReturn && parsedItems.length === 0 && (
            <div className="mb-4 space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">
                  Customer Name
                </Label>
              </div>
              <select
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={salesReturnCustomerSelect}
                onChange={(e) => {
                  setSalesReturnCustomerSelect(e.target.value);
                  if (e.target.value !== "new")
                    setSalesReturnCustomer(e.target.value);
                  else setSalesReturnCustomer("");
                }}
                data-ocid="returns.customer.select"
              >
                <option value="">Select customer...</option>
                {existingCustomerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="new">+ New Customer</option>
              </select>
              {salesReturnCustomerSelect === "new" && (
                <Input
                  placeholder="Enter customer name"
                  value={salesReturnCustomer}
                  onChange={(e) => setSalesReturnCustomer(e.target.value)}
                  className="text-sm"
                  data-ocid="returns.customer.input"
                />
              )}
            </div>
          )}
          <h2 className="font-display font-semibold text-sm text-foreground mb-4">
            Add Return Items
          </h2>
          <Tabs value={inputTab} onValueChange={setInputTab}>
            <TabsList
              className={`mb-4 ${
                isSalesReturn ? "bg-destructive/10" : "bg-primary/10"
              }`}
            >
              <TabsTrigger
                value="excel"
                className={`${activeTabClass} gap-1.5 text-xs text-foreground`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className={`${activeTabClass} gap-1.5 text-xs text-foreground`}
              >
                <PenLine className="w-3.5 h-3.5" />
                Manual
              </TabsTrigger>
              <TabsTrigger
                value="scanner"
                className={`${activeTabClass} gap-1.5 text-xs text-foreground`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="mt-4">
              <ExcelUploader onItemsParsed={setParsedItems} />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <ManualEntryForm onItemAdded={handleItemAdded} />
            </TabsContent>

            <TabsContent value="scanner" className="mt-4">
              <BarcodeScanner
                onBatchReady={(items) =>
                  setParsedItems((prev) => [...prev, ...items])
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Transaction History */}
      <div
        className={`bg-card border border-border rounded-2xl p-5 shadow-soft mt-4 ${
          isSalesReturn ? "section-card-rose" : "section-card-violet"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-2 h-6 rounded-full ${
              isSalesReturn ? "bg-destructive" : "bg-primary"
            }`}
          />
          <h2 className="font-display font-semibold text-base text-foreground">
            {isSalesReturn ? "Sales Returns" : "Purchase Returns"} History
          </h2>
        </div>
        <TransactionTotalsView
          transactions={returnTransactions}
          showReportDownloader
          colorTheme={isSalesReturn ? "rose" : "blue"}
        />
      </div>
    </div>
  );
}
