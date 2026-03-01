import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { AnalyticsData, JewelleryItem, ItemType, TransactionRecord, Customer, TransactionInput } from '../backend';

export function useAnalytics() {
  const { actor, isFetching } = useActor();

  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getAnalyticsData();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStock() {
  const { actor, isFetching } = useActor();

  return useQuery<JewelleryItem[]>({
    queryKey: ['stock'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getAllItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAvailableStock(transactionType: ItemType) {
  const { actor, isFetching } = useActor();

  return useQuery<JewelleryItem[]>({
    queryKey: ['availableStock', transactionType],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const allItems = await actor.getAllItems();
      return allItems.filter(item => !item.isSold);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTransactionsByType(transactionType: ItemType) {
  const { actor, isFetching } = useActor();

  return useQuery<TransactionRecord[]>({
    queryKey: ['transactions', transactionType],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getTransactionsByType(transactionType);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFactoryLedger() {
  const { actor, isFetching } = useActor();

  return useQuery<TransactionRecord[]>({
    queryKey: ['factory'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const purchases = await actor.getTransactionsByType('purchase' as ItemType);
      const purchaseReturns = await actor.getTransactionsByType('purchaseReturn' as ItemType);
      const combined = [...purchases, ...purchaseReturns];
      combined.sort((a, b) => Number(b.timestamp - a.timestamp));
      return combined;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBatchTransactionMutation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactions: TransactionInput[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addBatchTransactions(transactions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['availableStock'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['factory'] });
    },
  });
}

export function useAddBatchItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemsArray: Array<[string, number, number, number, bigint, ItemType]>) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addBatchItems(itemsArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['availableStock'] });
    },
  });
}

export function useAddBatchTransactions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactions: TransactionInput[]) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addBatchTransactions(transactions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['availableStock'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['factory'] });
    },
  });
}
