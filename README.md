# Investment Analytics Dashboard

A modern, responsive investment analytics dashboard built with Next.js, React, Tailwind CSS, and Supabase for the Algo Trading V1 project.

## Features

- 📊 **Data Tables Viewer**: View and filter data from Signals, Orders, trades, and Pnl tables
- 📈 **Open Positions**: Real-time view of current open trading positions with P&L
- 💹 **P&L Analysis**: Cumulative and daily profit/loss charts with detailed analytics
- 💼 **Portfolio Value**: Track portfolio value over time with trading activity
- 🔍 **Advanced Filtering**: Date range and column-based filtering
- 📥 **Data Export**: Export table data to CSV
- ⚡ **Lazy Loading**: Pagination support for large datasets
- 🎨 **Modern UI**: Dark theme with responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace with your actual Supabase credentials from your Supabase project settings.

## Database Schema

The dashboard expects the following tables in your Supabase database:

### Signals Table
```sql
CREATE TABLE "Signals" (
  "signalId" SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date TEXT NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  st1 NUMERIC NOT NULL,
  st1_dir NUMERIC NOT NULL,
  st2 NUMERIC NOT NULL,
  st2_dir NUMERIC NOT NULL,
  adx NUMERIC NOT NULL,
  plus_di NUMERIC NOT NULL,
  minus_di NUMERIC NOT NULL,
  lr_slope NUMERIC NOT NULL,
  lr_accel NUMERIC NOT NULL,
  both_st_bullish NUMERIC NOT NULL,
  strong_trend NUMERIC NOT NULL,
  rising_trend NUMERIC NOT NULL,
  accelerating NUMERIC NOT NULL,
  green_candle NUMERIC NOT NULL,
  signal TEXT NOT NULL,
  strategy TEXT NOT NULL,
  profit_pct NUMERIC NOT NULL,
  stop_loss_pct NUMERIC NOT NULL,
  status NUMERIC NOT NULL
);
```

### Orders Table
```sql
CREATE TABLE "Orders" (
  "orderId" SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  tradingsymbol TEXT NOT NULL,
  instrument_token NUMERIC NOT NULL,
  underlier_symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  strategy TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stoploss_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  "signalId" NUMERIC NOT NULL,
  timestamp TEXT NOT NULL
);
```

### Trades Table
```sql
CREATE TABLE "Trades" (
  "tradeId" SERIAL PRIMARY KEY,
  tradingsymbol TEXT NOT NULL,
  instrument_token NUMERIC NOT NULL,
  underlier_symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  date TEXT NOT NULL,
  "orderId" NUMERIC NOT NULL,
  side TEXT NOT NULL,
  strategy TEXT NOT NULL
);
```

### Pnl Table
```sql
CREATE TABLE "Pnl" (
  "pnlId" SERIAL PRIMARY KEY,
  tradeid NUMERIC NOT NULL,
  tradingsymbol TEXT NOT NULL,
  underlier_symbol TEXT NOT NULL,
  instrument_token NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  sell_price NUMERIC NOT NULL,
  buy_date TEXT NOT NULL,
  sell_date TEXT NOT NULL,
  comment TEXT NOT NULL,
  delta NUMERIC NOT NULL,
  strategy TEXT NOT NULL,
  asset_class TEXT NOT NULL
);
```

### OpenPositions Table
```sql
CREATE TABLE "OpenPositions" (
  orderid SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  tradingsymbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  side TEXT NOT NULL,
  buy_price NUMERIC NOT NULL,
  curr_price NUMERIC NOT NULL
);
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
Investment_Dashboard/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── TableViewer.tsx     # Data table viewer with filters
│   ├── OpenPositions.tsx   # Open positions display
│   ├── PnLChart.tsx        # P&L analytics charts
│   └── PortfolioChart.tsx  # Portfolio value charts
├── lib/
│   └── supabase.ts         # Supabase client configuration
├── types/
│   └── database.ts         # TypeScript database types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Features Detail

### Data Tables
- Select from 4 tables: Signals, Orders, trades, Pnl
- Date range filtering
- Column-based text filtering
- Pagination (50 records per page)
- CSV export functionality

### Open Positions
- View all open trades
- Real-time unrealized P&L calculation
- Position details: symbol, side, quantity, entry/current price
- Summary cards: total positions, total value, unrealized P&L

### P&L Analysis
- Cumulative P&L area chart
- Daily P&L breakdown (realized, unrealized, total)
- Win rate calculation
- Average daily P&L
- Date range filtering

### Portfolio Value
- Portfolio value over time
- Total return percentage
- Peak value and drawdown metrics
- Trading activity chart
- Date range filtering

## Design Principles

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes for extended use
- **Performance**: Lazy loading and pagination for large datasets
- **Type Safety**: Full TypeScript support
- **Modular Components**: Reusable and maintainable code
- **Error Handling**: Graceful error states and loading indicators

## Customization

### Changing Colors
Edit `app/globals.css` to modify the color scheme:
```css
:root {
  --primary: 217.2 91.2% 59.8%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... other colors */
}
```

### Modifying Pagination
Change the page size in `components/TableViewer.tsx`:
```typescript
const [pageSize] = useState(50); // Change to desired page size
```

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and anon key in `.env.local`
- Check that your Supabase project is active
- Ensure Row Level Security (RLS) policies allow read access

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Data Not Showing
- Verify tables exist in Supabase
- Check table names match exactly (case-sensitive)
- Ensure tables have data

## Contributing

This is a private project for Algo Trading V1. For issues or improvements, please contact the project maintainer.

## License

Private - All rights reserved
