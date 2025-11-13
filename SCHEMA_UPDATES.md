# Schema Updates - Fixed for Your Supabase Database

## Changes Made

The dashboard has been updated to work with your actual Supabase table schemas.

### Table Name Changes
- `trades` → `Trades` (capitalized)

### Column Mapping Updates

#### Signals Table
- Uses: `signalId`, `symbol`, `date`, `open`, `high`, `low`, `close`, etc.
- Date filtering: Uses `date` column
- Ordering: Uses `signalId` column

#### Orders Table  
- Uses: `orderId`, `date`, `tradingsymbol`, `instrument_token`, `side`, `quantity`, `price`, etc.
- Date filtering: Uses `date` column
- Ordering: Uses `orderId` column

#### Trades Table
- Uses: `tradeid`, `tradingsymbol`, `instrument_token`, `price`, `quantity`, `date`, `side`, `strategy`
- Date filtering: Uses `date` column
- Ordering: Uses `tradeid` column
- **Note**: Open Positions filters by `side='buy'` (adjust if needed)

#### Pnl Table
- Uses: `PnlId`, `tradeid`, `tradingsymbol`, `buy_price`, `sell_price`, `buy_date`, `sell_date`, `delta`, `strategy`
- Date filtering: Uses `sell_date` column
- Ordering: Uses `sell_date` column
- **Note**: `delta` field represents profit/loss for each trade

## Component Updates

### 1. TableViewer.tsx
- Added table-specific date column mapping
- Added table-specific ID column mapping for ordering
- Updated table names array to include `Trades` (capitalized)

### 2. OpenPositions.tsx
- Updated to use `Trades` table
- Changed field names: `id` → `tradeid`, `symbol` → `tradingsymbol`, `entry_price` → `price`
- Filters by `side='buy'` to show open positions
- Orders by `date` column

### 3. PnLChart.tsx
- Uses `Pnl` table with `sell_date` for filtering/ordering
- Calculates cumulative P&L from `delta` field
- Simplified chart to show only Trade P&L (removed realized/unrealized breakdown)
- Groups data by sell date

### 4. PortfolioChart.tsx
- Uses `Pnl` table with `sell_date` for filtering/ordering
- Calculates cumulative portfolio value starting from 100,000
- Adds `delta` to cumulative value for each trade
- Shows portfolio growth over time

### 5. types/database.ts
- Updated all table type definitions to match actual Supabase schema
- Added all columns from your tables

## Testing the Dashboard

1. **Data Tables Tab**: Should now load all 4 tables without errors
2. **Open Positions**: Shows trades where `side='buy'` 
3. **P&L Analysis**: Shows cumulative P&L and individual trade profits
4. **Portfolio Value**: Shows portfolio growth from starting value of $100,000

## Notes

- **Open Positions Logic**: Currently filters by `side='buy'`. If you have a different way to identify open positions (e.g., a `status` column), update line 31 in `OpenPositions.tsx`
- **Starting Portfolio Value**: Set to $100,000 in `PortfolioChart.tsx` line 44. Adjust if needed.
- **Mock Current Prices**: Open Positions uses mock current prices. Replace with real market data API in production.

## Error Resolution

The original error "column Signals.created_at does not exist" is now fixed because:
1. We use the actual column names from your schema
2. Date filtering uses the correct date columns for each table
3. Ordering uses the correct ID columns for each table

All components should now work correctly with your Supabase database!
