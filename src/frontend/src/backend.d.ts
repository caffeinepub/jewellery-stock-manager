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
    totalInventoryValue: number;
    returnCount: bigint;
    numberOfPieces: bigint;
    purchaseCount: bigint;
    salesCount: bigint;
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
export interface TransactionRecord {
    id: bigint;
    transactionType: ItemType;
    item: JewelleryItem;
    timestamp: bigint;
}
export enum ItemType {
    sale = "sale",
    purchase = "purchase",
    returned = "returned"
}
export interface backendInterface {
    addBatchTransactions(transactionsArray: Array<[string, ItemType, bigint]>): Promise<Array<string>>;
    addItem(code: string, grossWeight: number, stoneWeight: number, netWeight: number, pieces: bigint, itemType: ItemType): Promise<void>;
    addTransaction(code: string, transactionType: ItemType, timestamp: bigint): Promise<string>;
    createCustomer(name: string): Promise<void>;
    deleteCustomer(name: string): Promise<void>;
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
