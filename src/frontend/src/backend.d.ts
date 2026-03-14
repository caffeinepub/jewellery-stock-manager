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
    salesAggregate: TransactionAggregate;
    purchaseAggregate: TransactionAggregate;
    salesReturnAggregate: TransactionAggregate;
    purchaseReturnAggregate: TransactionAggregate;
}
export interface TransactionAggregate {
    totalPieces: bigint;
    totalWeight: number;
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
    metalPurity?: number;
    code: string;
    netWeight: number;
    cashBalance?: number;
    timestamp: bigint;
    quantity: bigint;
    stoneChargePerGram?: number;
    metalBalance?: number;
}
export interface TransactionRecord {
    id: bigint;
    customerName?: string;
    transactionCode: string;
    transactionType: ItemType;
    metalPurity?: number;
    netWeight: number;
    item: JewelleryItem;
    cashBalance?: number;
    timestamp: bigint;
    quantity: bigint;
    stoneChargePerGram?: number;
    metalBalance?: number;
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
    addTransaction(code: string, transactionType: ItemType, timestamp: bigint, customerName: string | null, quantity: bigint, netWeight: number, transactionCode: string, metalPurity: number | null, metalBalance: number | null, stoneChargePerGram: number | null, cashBalance: number | null): Promise<string>;
    createCustomer(name: string): Promise<void>;
    deleteCustomer(name: string): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllItems(): Promise<Array<JewelleryItem>>;
    getAllTransactions(): Promise<Array<TransactionRecord>>;
    getAvailableItemsByType(itemType: ItemType): Promise<Array<JewelleryItem>>;
    getCustomer(name: string): Promise<Customer | null>;
    getItem(code: string): Promise<JewelleryItem | null>;
    getTypeAggregates(): Promise<AnalyticsData>;
    renameCustomer(oldName: string, newName: string): Promise<void>;
    resetAllData(): Promise<void>;
    updateCustomer(name: string, newTransaction: TransactionRecord, newItem: JewelleryItem): Promise<void>;
}
