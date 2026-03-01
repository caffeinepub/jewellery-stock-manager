# Specification

## Summary
**Goal:** Fix dashboard cards showing zeros, split the Returns card into two separate cards, and apply the correct stock formula on both the Dashboard and Stock Summary page.

**Planned changes:**
- Fix the backend analytics query so that Current Stock, Sales, and Purchases cards fetch and display real non-zero values (Total Weight and Total Pieces) when transaction data exists
- Split the single "Returns" dashboard card into two separate cards: "Purchase Returns" and "Sales Returns", each showing their own Total Weight and Total Pieces; remove the original combined Returns card
- Apply the correct stock formula everywhere stock totals are computed (Dashboard Current Stock card and Stock page Summary tab): Stock = Purchases − Sales − Purchase Returns + Sales Returns, for Gross Weight, Net Weight, and Pieces

**User-visible outcome:** The Dashboard displays accurate, non-zero values for all summary cards, shows separate Purchase Returns and Sales Returns cards, and the Current Stock value (as well as the Stock page Summary) correctly reflects the formula Purchases − Sales − Purchase Returns + Sales Returns.
