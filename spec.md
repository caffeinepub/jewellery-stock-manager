# Jewellery Stock Manager

## Current State
Fully functional jewellery stock management app with Sales, Purchases, Returns, Stock, and Customers tabs. Dashboard shows 5 stat cards. Party Ledger in Customers tab shows Date/Type/Code/GW/Dr/Cr/Balance columns. Sales page has a plain text input for customer name. TransactionTotalsView always shows Customer column. Summary cards and table rows in non-dashboard tabs use neutral styling.

## Requested Changes (Diff)

### Add
- Reset Data button at the bottom of Dashboard — shows a confirmation dialog, then calls a new `resetAllData` backend function that wipes all items, transactions, and customers
- `resetAllData` Motoko backend function

### Modify
- Party Ledger table columns: replace current columns with GW, NW, CALCULATION (metalPurity %), PURE WT (metalBalance g), AMOUNT (cashBalance ₹)
- Customer name field in Sales page: change plain text Input to a searchable dropdown/combobox that lists existing customer names but also allows typing a new name
- TransactionTotalsView: add `hideCustomer` boolean prop; when true, hide the Customer column from table header and rows (used in Purchases)
- Summary cards in TransactionTotalsView: apply colorful gradient backgrounds matching the section color theme (green for sales, amber for purchases, rose for returns)
- Table rows in TransactionTotalsView: add alternating row colors and left border accent for visual vibrancy
- App layout: ensure 100% zoom works on both mobile and desktop — fix any overflow/scrolling issues, use fluid widths

### Remove
- Customer column from Purchase History table (via hideCustomer prop in Purchases.tsx)

## Implementation Plan
1. Regenerate Motoko backend with resetAllData function
2. Update backend.d.ts to include resetAllData
3. Add useResetAllData mutation hook in useQueries.ts
4. Add Reset Data button + confirmation dialog at bottom of Dashboard.tsx
5. In Customers.tsx Party Ledger: replace columns with GW, NW, CALCULATION, PURE WT, AMOUNT using metalPurity/metalBalance/cashBalance fields
6. In Sales.tsx: replace plain Input with a Select/combobox showing existing customers (from useCustomers), with option to type new name
7. In TransactionTotalsView.tsx: add hideCustomer prop, apply colorful summary cards and alternating row styles
8. In Purchases.tsx: pass hideCustomer={true} to TransactionTotalsView
9. Fix responsive layout for 100% zoom on mobile and desktop
