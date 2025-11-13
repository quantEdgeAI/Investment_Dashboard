# Testing Guide

## Prerequisites for Testing

Before testing, ensure you have:
1. Created `.env.local` file with valid Supabase credentials
2. Supabase database with tables: Signals, Orders, trades, Pnl
3. Some sample data in the tables

## Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Test Checklist

### 1. Data Tables Tab ✓

**Test Cases:**
- [ ] Page loads without errors
- [ ] Table selector dropdown shows all 4 tables (Signals, Orders, trades, Pnl)
- [ ] Selecting different tables loads appropriate data
- [ ] Date filters work (From Date and To Date)
- [ ] Column filters appear when "Filters" button is clicked
- [ ] Column filters correctly filter data
- [ ] Pagination works (Previous/Next buttons)
- [ ] Page numbers display correctly
- [ ] Refresh button reloads data
- [ ] Export button downloads CSV file
- [ ] CSV file contains correct data
- [ ] Empty state shows "No data available" message
- [ ] Loading state shows spinner

**Expected Behavior:**
- Data displays in table format with all columns
- Filters apply immediately
- Pagination shows 50 records per page
- CSV export includes all filtered data

### 2. Open Positions Tab ✓

**Test Cases:**
- [ ] Summary cards show correct values (Open Positions, Total Value, Unrealized P&L)
- [ ] Position cards display for each open trade
- [ ] Each card shows: symbol, side, quantity, entry price, current price, unrealized P&L
- [ ] Buy positions show green badge
- [ ] Sell positions show red badge
- [ ] Positive P&L shows in green with + sign
- [ ] Negative P&L shows in red with - sign
- [ ] Refresh button updates data
- [ ] Empty state shows "No open positions" message
- [ ] Loading state shows spinner

**Expected Behavior:**
- Only trades with status='open' are displayed
- P&L calculations are accurate
- Cards are responsive (grid layout)

### 3. P&L Analysis Tab ✓

**Test Cases:**
- [ ] Summary cards show: Total P&L, Avg Daily P&L, Win Rate, Trading Days
- [ ] Win rate calculation is correct (winning days / total days)
- [ ] Cumulative P&L chart displays correctly
- [ ] Chart shows gradient area fill
- [ ] Daily P&L breakdown chart displays
- [ ] Three lines show: Realized P&L, Unrealized P&L, Total P&L
- [ ] Date filters work correctly
- [ ] Tooltip shows on hover with formatted values
- [ ] X-axis shows dates in readable format
- [ ] Y-axis shows currency values
- [ ] Refresh button updates charts
- [ ] Empty state shows "No P&L data available"
- [ ] Loading state shows spinner

**Expected Behavior:**
- Charts are responsive
- Cumulative P&L increases/decreases over time
- Colors: Realized (green), Unrealized (orange), Total (blue)

### 4. Portfolio Value Tab ✓

**Test Cases:**
- [ ] Summary cards show: Current Value, Total Return, Peak Value, Total Trades
- [ ] Total Return percentage is calculated correctly
- [ ] Drawdown percentage displays under Peak Value
- [ ] Portfolio value chart displays correctly
- [ ] Chart shows gradient area fill (green)
- [ ] Trading activity chart displays
- [ ] Date filters work correctly
- [ ] Tooltip shows formatted values
- [ ] Refresh button updates charts
- [ ] Empty state shows "No portfolio data available"
- [ ] Loading state shows spinner

**Expected Behavior:**
- Portfolio value chart shows growth/decline over time
- Trading activity shows number of trades per day
- Charts are responsive

### 5. General UI/UX ✓

**Test Cases:**
- [ ] Header displays "Investment Analytics" title
- [ ] "Live" indicator shows with green pulsing dot
- [ ] Tab navigation works smoothly
- [ ] Active tab is highlighted
- [ ] Dark theme is applied consistently
- [ ] Responsive design works on different screen sizes
- [ ] All icons display correctly (Lucide icons)
- [ ] Hover effects work on buttons and cards
- [ ] Loading states are smooth
- [ ] Error messages display clearly

**Responsive Testing:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 6. Performance ✓

**Test Cases:**
- [ ] Initial page load is under 3 seconds
- [ ] Tab switching is instant
- [ ] Data fetching shows loading indicator
- [ ] Large datasets (1000+ records) load with pagination
- [ ] Charts render smoothly
- [ ] No console errors
- [ ] No memory leaks

### 7. Error Handling ✓

**Test Cases:**
- [ ] Invalid Supabase credentials show error message
- [ ] Network errors display user-friendly message
- [ ] Empty tables show appropriate message
- [ ] Failed API calls show error state
- [ ] Errors don't crash the application

## Sample Test Data

If you need to populate your database with test data, here are some SQL scripts:

### Sample Signals Data
```sql
INSERT INTO "Signals" (symbol, signal_type, price, quantity, timestamp, strategy, confidence)
VALUES 
  ('AAPL', 'BUY', 150.25, 100, NOW(), 'Momentum', 0.85),
  ('GOOGL', 'SELL', 2800.50, 50, NOW(), 'Mean Reversion', 0.75),
  ('MSFT', 'BUY', 380.00, 75, NOW(), 'Breakout', 0.90);
```

### Sample Orders Data
```sql
INSERT INTO "Orders" (order_id, symbol, order_type, side, quantity, price, status, timestamp, filled_quantity, average_price)
VALUES 
  ('ORD001', 'AAPL', 'LIMIT', 'BUY', 100, 150.25, 'FILLED', NOW(), 100, 150.25),
  ('ORD002', 'GOOGL', 'MARKET', 'SELL', 50, 2800.50, 'FILLED', NOW(), 50, 2800.50);
```

### Sample Trades Data
```sql
INSERT INTO trades (trade_id, symbol, side, quantity, entry_price, exit_price, entry_time, exit_time, status, pnl)
VALUES 
  ('TRD001', 'AAPL', 'buy', 100, 150.00, NULL, NOW(), NULL, 'open', NULL),
  ('TRD002', 'GOOGL', 'sell', 50, 2800.00, 2750.00, NOW() - INTERVAL '1 day', NOW(), 'closed', 2500.00);
```

### Sample P&L Data
```sql
INSERT INTO "Pnl" (date, realized_pnl, unrealized_pnl, total_pnl, portfolio_value, trades_count)
VALUES 
  (CURRENT_DATE - INTERVAL '5 days', 1000.00, 500.00, 1500.00, 100000.00, 5),
  (CURRENT_DATE - INTERVAL '4 days', 1200.00, 300.00, 1500.00, 101500.00, 3),
  (CURRENT_DATE - INTERVAL '3 days', -500.00, 800.00, 300.00, 101800.00, 4),
  (CURRENT_DATE - INTERVAL '2 days', 2000.00, 200.00, 2200.00, 104000.00, 6),
  (CURRENT_DATE - INTERVAL '1 day', 1500.00, 400.00, 1900.00, 105900.00, 4),
  (CURRENT_DATE, 800.00, 600.00, 1400.00, 107300.00, 3);
```

## Known Issues

1. **React Hook Warnings**: ESLint warnings about missing dependencies in useEffect - these are intentional to prevent infinite loops
2. **Build without env vars**: Build works with placeholder values, but runtime requires actual Supabase credentials

## Browser Compatibility

Tested and working on:
- Chrome 120+
- Firefox 121+
- Edge 120+
- Safari 17+

## Reporting Issues

If you encounter issues:
1. Check browser console for errors
2. Verify `.env.local` has correct credentials
3. Check Supabase dashboard for table structure
4. Ensure RLS policies allow read access
5. Try clearing browser cache and restarting dev server
