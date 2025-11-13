# Column Sorting Feature - TableViewer Component

## Overview

Added interactive column sorting functionality to the TableViewer component. Users can now click on any column header to sort data in ascending or descending order.

## Features

### 1. **Click to Sort**
- Click any column header to sort by that column
- First click: Sort ascending (A→Z, 0→9, oldest→newest)
- Second click: Sort descending (Z→A, 9→0, newest→oldest)
- Third click: Toggle back to ascending

### 2. **Visual Indicators**
- **Unsorted columns**: Show `⇅` (up-down arrows) icon on hover
- **Sorted ascending**: Show `↑` (up arrow) icon
- **Sorted descending**: Show `↓` (down arrow) icon
- **Hover effect**: Column headers highlight on hover

### 3. **Smart Behavior**
- Sorting resets to page 1 to show results from the beginning
- Sorting state is preserved when filtering or paginating
- Sorting resets when switching tables
- Default sort: By ID column in descending order (newest first)

## How It Works

### User Interaction
1. **Click column header** → Data sorts ascending by that column
2. **Click same header again** → Data sorts descending
3. **Click different header** → Sorts by new column (ascending)
4. **Change table** → Sorting resets to default

### Visual Feedback
```
Unsorted:  Column Name ⇅  (faded icon)
Ascending: Column Name ↑  (blue icon)
Descending: Column Name ↓ (blue icon)
```

## Technical Implementation

### State Management
```typescript
const [sortColumn, setSortColumn] = useState<string>('');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
```

### Sort Logic
- **No sort column**: Uses default ID column (signalId, orderId, tradeid, PnlId)
- **Sort column set**: Uses selected column with chosen direction
- **Supabase query**: `.order(column, { ascending: true/false })`

### Icons Used
- `ArrowUpDown`: Unsorted state (hoverable)
- `ArrowUp`: Ascending sort
- `ArrowDown`: Descending sort

## Code Changes

### File: `components/TableViewer.tsx`

1. **Imports** (Line 5):
   ```typescript
   import { ..., ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
   ```

2. **State** (Lines 43-45):
   ```typescript
   const [sortColumn, setSortColumn] = useState<string>('');
   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
   ```

3. **Sort Handler** (Lines 117-127):
   ```typescript
   const handleSort = (column: string) => {
     if (sortColumn === column) {
       setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
     } else {
       setSortColumn(column);
       setSortDirection('asc');
     }
     setCurrentPage(1);
   };
   ```

4. **Icon Helper** (Lines 129-136):
   ```typescript
   const getSortIcon = (column: string) => {
     if (sortColumn !== column) {
       return <ArrowUpDown className="h-3 w-3 opacity-50" />;
     }
     return sortDirection === 'asc' 
       ? <ArrowUp className="h-3 w-3" />
       : <ArrowDown className="h-3 w-3" />;
   };
   ```

5. **Query Logic** (Lines 75-83):
   ```typescript
   const orderColumn = sortColumn || tableIdColumns[selectedTable];
   const ascending = sortColumn ? sortDirection === 'asc' : false;
   query = query.range(from, to).order(orderColumn, { ascending });
   ```

6. **UI Update** (Lines 289-297):
   ```tsx
   <button
     onClick={() => handleSort(column)}
     className="flex items-center gap-2 hover:text-foreground transition-colors w-full text-left group"
   >
     <span>{column}</span>
     <span className="group-hover:opacity-100 transition-opacity">
       {getSortIcon(column)}
     </span>
   </button>
   ```

## Usage Examples

### Example 1: Sort by Signal ID
1. Click on "signalId" column header
2. Data sorts ascending (1, 2, 3...)
3. Click again → descending (3, 2, 1...)

### Example 2: Sort by Date
1. Click on "date" column header
2. Data sorts ascending (oldest first)
3. Click again → descending (newest first)

### Example 3: Sort by Symbol
1. Click on "symbol" column header
2. Data sorts alphabetically (A→Z)
3. Click again → reverse alphabetically (Z→A)

### Example 4: Multiple Columns
1. Sort by "date" (ascending)
2. Click "symbol" → Now sorted by symbol (ascending)
3. Previous sort is replaced

## Benefits

1. **Better Data Exploration**: Quickly find highest/lowest values
2. **Flexible Analysis**: Sort by any column (numeric, text, dates)
3. **Intuitive UX**: Standard table sorting behavior
4. **Visual Clarity**: Clear indicators show sort state
5. **Performance**: Server-side sorting via Supabase

## Compatibility

- Works with all 4 tables: Signals, Orders, Trades, Pnl
- Supports all data types: numbers, text, dates, timestamps
- Compatible with existing filters and pagination
- Responsive design maintained

## Testing Checklist

- [ ] Click column headers to sort
- [ ] Verify ascending sort (↑ icon shows)
- [ ] Verify descending sort (↓ icon shows)
- [ ] Check sort persists during pagination
- [ ] Verify sort resets when changing tables
- [ ] Test with date columns
- [ ] Test with numeric columns
- [ ] Test with text columns
- [ ] Check hover effects work
- [ ] Verify icons display correctly

## Future Enhancements

Possible improvements:
- Multi-column sorting (hold Shift + click)
- Remember sort preferences per table
- Sort by multiple columns simultaneously
- Custom sort orders for specific columns
- Sort indicators in column filter inputs
