# Specification

## Summary
**Goal:** Fix stock synchronization issues, improve mobile UX, add report downloads, and modernize UI design with a bold color theme.

**Planned changes:**
- Fix Dashboard current stock calculation to match Stock View page using same backend data source
- Update Stock View to fetch only live unsold items with real-time synchronization
- Remove unnecessary 'Sales' and 'Purchase' badge labels from stock items
- Add click-to-navigate from Dashboard Current Stock to Stock Tab
- Add action buttons in Stock View for recording Sales, Sales Return, Purchase Return transactions
- Fix Customer page filtering to show sales, returns, total gross weight, and pieces sold
- Highlight completed sales transactions and make customer names clickable links
- Resize CODE prefix tabs in Sales page to fit all four on iPhone screen without scrolling
- Move Upload option above CODE prefix tabs as shared entry point
- Implement persistent camera permission handling for barcode scanner (ask once per session)
- Add report download functionality (PDF and Excel) to Sales, Purchases, Sales Return, Purchase Return, and Stock View pages
- Enable row selection by clicking anywhere on row (not just checkbox) with visual highlighting
- Redesign color theme with bold, modern palette (clean lines, playful accents, high contrast, avoiding blue/purple)
- Apply modern mobile-optimized UI styling with spacious cards, clear typography, subtle gradients/shadows, smooth transitions, contemporary icons, and generous whitespace

**User-visible outcome:** Stock data is accurately synchronized across Dashboard and Stock View, mobile experience is optimized with easier navigation and selection, reports can be downloaded in PDF/Excel formats, and the entire application has a fresh, modern, mobile-first design with a vibrant color theme.
