# Jewellery Stock Manager

## Current State
- `addBatchTransactions` in the backend returns `[Text]` — either "Transaction successful" or "Item already sold" per item
- `TransactionPreview.handleConfirm` calls `addBatchTransactions.mutateAsync()` but NEVER checks the returned results array
- If ALL items return "Item already sold", the form resets (onConfirm called) and queries are invalidated, but NO transactions are stored and the sales record stays empty
- No warning is shown to the user when items are already sold
- Customer tab doesn't update because no transaction was actually saved

## Requested Changes (Diff)

### Add
- Backend: `forceSale: ?Bool` field to `TransactionInput` type — when true, bypass the `isSold` check so the sale is recorded regardless
- Frontend: After `addBatchTransactions.mutateAsync` returns, inspect the results array
- Frontend: If any items returned "Item already sold", show a warning dialog listing the duplicate item codes
- Frontend: Warning dialog has two options: "Cancel" (abort entirely) and "Override & Record" (resubmit only the failed items with forceSale=true)
- Frontend: Only call `onConfirm()` when at least one transaction was actually recorded (results contain at least one "Transaction successful")

### Modify
- Backend `addTransactionInternal`: accept `forceSale` param; when true, skip the `item.isSold` check for sales
- Backend `addBatchTransactions`: pass `transaction.forceSale` down to `addTransactionInternal`
- Frontend `TransactionPreview.handleConfirm`: check results, split into succeeded/failed, show override dialog if any failed with "Item already sold"

### Remove
- Silent swallowing of "Item already sold" backend results

## Implementation Plan
1. Update backend `TransactionInput` to include `forceSale: ?Bool`
2. Update `addTransactionInternal` to accept forceSale param and skip isSold check when true
3. Update `addBatchTransactions` to pass forceSale through
4. In `TransactionPreview.tsx`, after mutateAsync returns, zip results with items
5. Split items into succeeded / alreadySold
6. If alreadySold is non-empty, show a warning dialog with the list of duplicate codes
7. "Override & Record": resubmit only the alreadySold items with forceSale=true
8. Only call onConfirm() after at least one item succeeded (or override succeeded)
