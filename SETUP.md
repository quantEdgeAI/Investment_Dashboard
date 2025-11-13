# Quick Setup Guide

## Step 1: Create Environment File

Create a file named `.env.local` in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**To get your Supabase credentials:**
1. Go to https://supabase.com
2. Open your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon/public" key

## Step 2: Verify Database Tables

Make sure your Supabase database has these tables:
- `Signals`
- `Orders`
- `trades`
- `Pnl`

See README.md for the complete schema.

## Step 3: Run the Application

```bash
npm run dev
```

Open http://localhost:3000

## Troubleshooting

If you see "Failed to fetch data" errors:
1. Check your `.env.local` file has correct credentials
2. Verify tables exist in Supabase
3. Check Supabase RLS policies allow read access
4. Restart the dev server after changing `.env.local`

## Quick Test

To verify everything works:
1. Navigate to "Data Tables" tab
2. Select a table from dropdown
3. You should see data or "No data available" message
4. Try other tabs: Open Positions, P&L Analysis, Portfolio Value
