# Supabase Connection Information

## Current Setup ✅

Your project uses **Supabase REST API** (NOT Direct Database Connection), which is **fully compatible with IPv4**.

### Connection Method: REST API via HTTPS
- **URL**: `https://dtlylrntpvgzauqcbmfv.supabase.co`
- **Protocol**: HTTPS (REST API)
- **Client**: `@supabase/supabase-js`
- **IPv4 Compatible**: ✅ YES
- **Works on**: All networks (IPv4 and IPv6)

## Connection Types Explained

### 1. REST API Connection (What you're using) ✅
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://dtlylrntpvgzauqcbmfv.supabase.co',
  'your-anon-key'
);
```
- **Protocol**: HTTPS
- **Port**: 443
- **IPv4**: ✅ Fully supported
- **IPv6**: ✅ Also supported
- **Use case**: Web apps, mobile apps, serverless functions

### 2. Direct Database Connection (What the warning is about) ⚠️
```
postgresql://postgres:[PASSWORD]@db.dtlylrntpvgzauqcbmfv.supabase.co:5432/postgres
```
- **Protocol**: PostgreSQL wire protocol
- **Port**: 5432
- **IPv4**: ❌ NOT supported (requires Session Pooler or IPv4 add-on)
- **IPv6**: ✅ Supported
- **Use case**: Backend servers, long-running processes, ORMs

## Why the Warning Doesn't Apply to You

The Supabase documentation warning about IPv4 incompatibility applies **ONLY** to:
- Direct PostgreSQL connections (port 5432)
- Using connection strings with `postgresql://` protocol
- Tools like `psql`, database GUIs, or ORMs connecting directly to the database

Your project uses the **REST API** which:
- Connects via HTTPS (port 443)
- Works perfectly with IPv4
- Is the recommended approach for web applications

## Troubleshooting Your "Failed to fetch" Error

The error is **NOT** related to IPv4/IPv6. Possible causes:

### 1. Row Level Security (RLS) Policies
Check if your tables have RLS enabled without proper policies:
```sql
-- In Supabase SQL Editor
ALTER TABLE "Signals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pnl" ENABLE ROW LEVEL SECURITY;

-- Add policies to allow anonymous access (if needed)
CREATE POLICY "Allow anonymous read" ON "Signals" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON "Orders" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON "Trades" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON "Pnl" FOR SELECT USING (true);
```

### 2. Table Name Case Sensitivity
Supabase table names are case-sensitive. Verify:
- Your code uses: `Signals`, `Orders`, `Trades`, `Pnl`
- Database has: Same exact names (check in Supabase dashboard)

### 3. API Key Issues
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check if the key has expired
- Ensure the key has proper permissions

### 4. Network/CORS Issues
- Check browser console for CORS errors
- Verify Supabase project is not paused
- Check if your IP is blocked

## How to Diagnose

1. **Go to your dashboard**: http://localhost:3000
2. **Click the "Diagnostics" tab** (newly added)
3. **Click "Run Diagnostics"**
4. **Review the results** to see exactly what's failing

## Connection Test Results

Based on the diagnostic script:
- ✅ Supabase URL resolves to IPv4: `172.64.149.246`, `104.18.38.10`
- ✅ IPv4 connection successful on port 443
- ❌ No IPv6 records found (not needed for REST API)
- ✅ REST API is accessible via IPv4

## Conclusion

**Your setup is correct!** The IPv4 warning from Supabase documentation does NOT apply to your REST API connection. The "Failed to fetch" error is caused by something else (likely RLS policies or table permissions).

Use the Diagnostics tab to identify the actual issue.
