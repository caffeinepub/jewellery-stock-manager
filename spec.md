# Jewellery Stock Manager

## Current State
Sale submission errors are silently caught with `console.error` only — the user sees no feedback when the canister is stopped or the call fails. Return values from `addBatchTransactions` (e.g. "Item already sold") are ignored, so if all items fail, the form resets but nothing is recorded. Customers page doesn't reflect new sales.

## Requested Changes (Diff)

### Add
- Visible error toast/alert when `addBatchTransactions` throws (currently only `console.error`)
- Warning shown to user when backend returns "Item already sold" for any items
- Force query refetch (not just invalidate) after successful sale so data shows immediately

### Modify
- `TransactionPreview.tsx` `handleConfirm`: replace silent `catch` with visible error display using toast or inline error message
- Check the string array returned by `addBatchTransactions` — if any items returned "Item already sold", show a warning listing those codes
- `useAddBatchTransactions` in `useQueries.ts`: after invalidateQueries, also call `refetchQueries` for transactions and customers to force immediate refresh

### Remove
- Nothing removed

## Implementation Plan
1. In `TransactionPreview.tsx`, in the `catch` block of `handleConfirm`, show a visible error (use `toast.error` or set an error state that renders in the UI)
2. After `addBatchTransactions.mutateAsync` resolves, check the returned string array — if any result includes "already sold", display a warning to the user with which codes were affected
3. In `useQueries.ts` `useAddBatchTransactions` `onSuccess`, after invalidateQueries calls, also call `queryClient.refetchQueries` for `["transactions"]` and `["customers"]` to ensure immediate data refresh
