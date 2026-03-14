import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  ItemType,
  JewelleryItem,
  TransactionAggregate,
  TransactionInput,
  TransactionRecord,
} from "../backend";
import { useActor } from "./useActor";

export interface AggregatesData {
  currentStock: TransactionAggregate;
  sales: TransactionAggregate;
  purchases: TransactionAggregate;
  purchaseReturns: TransactionAggregate;
  salesReturns: TransactionAggregate;
}

const defaultAggregates: AggregatesData = {
  currentStock: { totalWeight: 0, totalPieces: BigInt(0) },
  sales: { totalWeight: 0, totalPieces: BigInt(0) },
  purchases: { totalWeight: 0, totalPieces: BigInt(0) },
  purchaseReturns: { totalWeight: 0, totalPieces: BigInt(0) },
  salesReturns: { totalWeight: 0, totalPieces: BigInt(0) },
};

// On the Internet Computer, Motoko variant types are returned as JS objects like { sale: null }
// not as string values. This helper handles both cases.
function matchesVariant(txType: ItemType, key: string): boolean {
  if (typeof txType === "string") return (txType as string) === key;
  return Object.keys(txType as unknown as object)[0] === key;
}

export function useAnalytics() {
  const { actor, isFetching } = useActor();

  return useQuery<AggregatesData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) return defaultAggregates;
      const result = await actor.getTypeAggregates();

      const sales = result.salesAggregate;
      const purchases = result.purchaseAggregate;
      const salesReturns = result.salesReturnAggregate;
      const purchaseReturns = result.purchaseReturnAggregate;

      // Derive current stock: Purchases - Sales - PurchaseReturns + SalesReturns
      const currentStockWeight = Math.max(
        0,
        purchases.totalWeight -
          sales.totalWeight -
          purchaseReturns.totalWeight +
          salesReturns.totalWeight,
      );
      const currentStockPieces = BigInt(
        Math.max(
          0,
          Number(purchases.totalPieces) -
            Number(sales.totalPieces) -
            Number(purchaseReturns.totalPieces) +
            Number(salesReturns.totalPieces),
        ),
      );

      return {
        currentStock: {
          totalWeight: currentStockWeight,
          totalPieces: currentStockPieces,
        },
        sales,
        purchases,
        purchaseReturns,
        salesReturns,
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useStock() {
  const { actor, isFetching } = useActor();

  return useQuery<JewelleryItem[]>({
    queryKey: ["stock"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllItems();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useAvailableStock(transactionType: ItemType) {
  const { actor, isFetching } = useActor();

  return useQuery<JewelleryItem[]>({
    queryKey: ["availableStock", transactionType],
    queryFn: async () => {
      if (!actor) return [];
      const allItems = await actor.getAllItems();
      return allItems.filter((item) => !item.isSold);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useTransactionsByType(transactionType: ItemType) {
  const { actor, isFetching } = useActor();
  // Extract the string key from the variant (handles both string enum and IC object variant)
  const typeKey =
    typeof transactionType === "string"
      ? (transactionType as string)
      : Object.keys(transactionType as unknown as object)[0];

  return useQuery<TransactionRecord[]>({
    queryKey: ["transactions", typeKey],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllTransactions();
      return all.filter((t) => matchesVariant(t.transactionType, typeKey));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useFactoryLedger() {
  const { actor, isFetching } = useActor();

  return useQuery<TransactionRecord[]>({
    queryKey: ["factory"],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllTransactions();
      const filtered = all.filter(
        (t) =>
          matchesVariant(t.transactionType, "purchase") ||
          matchesVariant(t.transactionType, "purchaseReturn"),
      );
      filtered.sort((a, b) => Number(b.timestamp - a.timestamp));
      return filtered;
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useBatchTransactionMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactions: TransactionInput[]) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addBatchTransactions(transactions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["availableStock"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["factory"] });
    },
  });
}

export function useAddBatchItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      itemsArray: Array<[string, number, number, number, bigint, ItemType]>,
    ) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addBatchItems(itemsArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["availableStock"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["factory"] });
    },
  });
}

export function useAddBatchTransactions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactions: TransactionInput[]) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addBatchTransactions(transactions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["availableStock"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["factory"] });
    },
  });
}

export function useRenameCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      oldName,
      newName,
    }: {
      oldName: string;
      newName: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.renameCustomer(oldName, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useResetAllData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.resetAllData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["availableStock"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["factory"] });
    },
  });
}
