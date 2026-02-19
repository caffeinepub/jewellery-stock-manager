# Specification

## Summary
**Goal:** Simplify UI across all screens, fix Dashboard calculations to correctly aggregate transaction data, and redesign Sales/Returns with CODE chart tabs for filtered stock selection.

**Planned changes:**
- Remove excessive celebration text, titles, and use case explanations from all screens (Dashboard, Sales, Purchases, Returns, Stock View, Customers, Factory)
- Fix Dashboard analytics to correctly derive and aggregate totals from all four transaction types (Sales, Purchases, Sales Return, Purchase Return)
- Simplify main Dashboard layout to avoid repeating data between summary cards and charts/tabs
- Replace current stock selector in Sales and Sales Return pages with colorful CODE chart tabs (e.g., NKST, CTNKST)
- Implement drill-down functionality where clicking a CODE chart tab filters stock to show only matching rows
- Allow users to select rows from multiple CODE tabs, accumulate selections, and record all as a single batch transaction
- Update stock filtering logic to display only current live stock that reflects the state after the most recent transaction
- Implement real-time inventory state management in backend so Sales moves items to customers, Purchases add to stock, Sales Return restores to stock, and Purchase Return removes from stock
- Optimize transaction recording performance to ensure multi-row batch entries process quickly and instantly

**User-visible outcome:** Users see a cleaner, more professional UI without repetitive text. Dashboard totals now correctly reflect all transaction types. Sales and Returns pages feature intuitive CODE chart tabs for browsing and selecting stock, with live inventory filtering that ensures only currently available items appear after each transaction. Batch recording of multiple items is fast and instant.
