# Date Filter Fix - TableViewer Component

## Issues Fixed

### 1. **Wrong Date Column for Pnl Table**
- **Before**: Used `tradeid` (which is a number, not a date)
- **After**: Uses `sell_date` (the actual date column)

### 2. **Date Picker Not Visible in Dark Theme**
- **Issue**: Date picker calendar was invisible due to dark theme
- **Fix**: Added `colorScheme: 'dark'` style and `[color-scheme:dark]` class to date inputs
- **Result**: Calendar picker is now visible and usable

### 3. **No Visual Feedback for Active Filters**
- **Added**: Blue banner showing active date filters
- **Added**: "Clear Dates" button that appears when filters are active
- **Result**: Users can now see when filters are applied and easily clear them

## Changes Made

### File: `components/TableViewer.tsx`

1. **Line 15**: Fixed Pnl date column mapping
   ```typescript
   'Pnl': 'sell_date'  // Was: 'tradeid'
   ```

2. **Lines 174-175, 190-191**: Added dark theme support to date inputs
   ```typescript
   className="... [color-scheme:dark]"
   style={{ colorScheme: 'dark' }}
   ```

3. **Lines 204-214**: Added "Clear Dates" button
   - Only shows when date filters are active
   - Clears both from and to dates
   - Resets to page 1

4. **Lines 235-242**: Added active filters indicator
   - Shows which date filters are currently applied
   - Displays in blue banner above the table

## How It Works Now

1. **Click on date input** → Calendar picker opens (now visible in dark theme)
2. **Select a date** → Filter is applied immediately, data refreshes
3. **Blue banner appears** → Shows active filters
4. **"Clear Dates" button appears** → Click to remove all date filters
5. **Data updates automatically** → No need to click refresh

## Testing

To test the date filters:

1. **Select a From Date**: Click the "From Date" input and choose a date
2. **Select a To Date**: Click the "To Date" input and choose a date
3. **Verify**: 
   - Blue banner shows "Active Filters: From: YYYY-MM-DD To: YYYY-MM-DD"
   - Table data updates to show only records within date range
   - "Clear Dates" button appears
4. **Clear Filters**: Click "Clear Dates" to remove filters

## Date Format

- **Input Format**: YYYY-MM-DD (standard HTML5 date input)
- **Database Query**: Uses the same format for Supabase filtering
- **Display Format**: Shows as selected in the active filters banner

## Notes

- Date filtering works on the appropriate date column for each table:
  - **Signals**: `date` column
  - **Orders**: `date` column  
  - **Trades**: `date` column
  - **Pnl**: `sell_date` column
- Filters are applied using Supabase's `gte()` (greater than or equal) and `lte()` (less than or equal) operators
- Page resets to 1 when filters change to show results from the beginning

## Browser Compatibility

The date picker now works correctly in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- All modern browsers with dark theme support
