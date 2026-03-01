import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AnalyticsData {
    totalWeightSold: number;
    currentStockPieces: bigint;
    totalPurchaseReturnPieceCount: bigint;
    totalPurchaseReturnWeight: number;
    totalInventoryValue: number;
    salesReturnCount: bigint;
    salesTransactionCount: bigint;
    totalPiecesPurchased: bigint;
    totalSalesReturnWeight: number;
    currentStockNetWeight: number;
    totalSalesReturnPieceCount: bigint;
    numberOfPieces: bigint;
    purchaseCount: bigint;
    salesCount: bigint;
    purchaseReturnCount: bigint;
    totalWeightPurchased: number;
    totalPiecesSold: bigint;
}
export interface JewelleryItem {
    code: string;
    netWeight: number;
    isSold: boolean;
    pieces: bigint;
    grossWeight: number;
    itemType: ItemType;
    stoneWeight: number;
}
export interface Customer {
    currentHoldings: Array<JewelleryItem>;
    name: string;
    transactionHistory: Array<TransactionRecord>;
}
export interface TransactionInput {
    customerName?: string;
    transactionCode: string;
    transactionType: ItemType;
    code: string;
    netWeight: number;
    timestamp: bigint;
    quantity: bigint;
}
export interface TransactionRecord {
    id: bigint;
    customerName?: string;
    transactionCode: string;
    transactionType: ItemType;
    netWeight: number;
    item: JewelleryItem;
    timestamp: bigint;
    quantity: bigint;
}
export enum ItemType {
    salesReturn = "salesReturn",
    sale = "sale",
    purchaseReturn = "purchaseReturn",
    purchase = "purchase"
}
export interface backendInterface {
    addBatchItems(itemsArray: Array<[string, number, number, number, bigint, ItemType]>): Promise<void>;
    addBatchTransactions(transactionsArray: Array<TransactionInput>): Promise<Array<string>>;
    addItem(code: string, grossWeight: number, stoneWeight: number, netWeight: number, pieces: bigint, itemType: ItemType): Promise<void>;
    addTransaction(code: string, transactionType: ItemType, timestamp: bigint, customerName: string | null, quantity: bigint, netWeight: number, transactionCode: string): Promise<string>;
    createCustomer(name: string): Promise<void>;
    deleteCustomer(name: string): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllItems(): Promise<Array<JewelleryItem>>;
    getAllTransactions(): Promise<Array<TransactionRecord>>;
    getAnalyticsData(): Promise<AnalyticsData>;
    getAvailableItemsByType(itemType: ItemType): Promise<Array<JewelleryItem>>;
    getCustomer(name: string): Promise<Customer | null>;
    getItem(code: string): Promise<JewelleryItem | null>;
    getTransaction(id: bigint): Promise<TransactionRecord | null>;
    getTransactionsByType(transactionType: ItemType): Promise<Array<TransactionRecord>>;
    updateCustomer(name: string, newTransaction: TransactionRecord, newItem: JewelleryItem): Promise<void>;
}
