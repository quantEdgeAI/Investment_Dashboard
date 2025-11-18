'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, Search } from 'lucide-react';

interface SymbolPnL {
  symbol: string;
  pnl: number;
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
  avgDaysPerTrade: number;
}

export default function PnLSymbol() {
  const [data, setData] = useState<SymbolPnL[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof SymbolPnL>('pnl');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSymbolPnL = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: fetchedData, error: fetchError } = await supabase
        .from('Pnl')
        .select('underlier_symbol, delta, comment, buy_date, sell_date')
        .order('underlier_symbol', { ascending: true });

      if (fetchError) throw fetchError;

      // Group by symbol and calculate metrics
      const symbolMap = new Map<string, { pnl: number; wins: number; losses: number; totalTrades: number; totalDays: number }>();

      (fetchedData || []).forEach((item: any) => {
        const symbol = item.underlier_symbol;
        const delta = item.delta || 0;
        const comment = (item.comment || '').toUpperCase();
        const buyDate = item.buy_date;
        const sellDate = item.sell_date;

        if (!symbolMap.has(symbol)) {
          symbolMap.set(symbol, { pnl: 0, wins: 0, losses: 0, totalTrades: 0, totalDays: 0 });
        }

        const symbolData = symbolMap.get(symbol)!;
        symbolData.pnl += delta;
        symbolData.totalTrades += 1;

        // Calculate days for this trade
        if (buyDate && sellDate) {
          const buyDateTime = new Date(buyDate).getTime();
          const sellDateTime = new Date(sellDate).getTime();
          const daysInTrade = Math.round((sellDateTime - buyDateTime) / (1000 * 60 * 60 * 24));
          symbolData.totalDays += daysInTrade;
        }

        // Determine win/loss based on comment
        if (comment.includes('TP')) {
          symbolData.wins += 1;
        } else if (comment.includes('SL')) {
          symbolData.losses += 1;
        }
      });

      // Convert to array and calculate win rate and average days per trade
      const symbolPnLArray: SymbolPnL[] = Array.from(symbolMap.entries()).map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        winRate: data.totalTrades > 0 ? (data.wins / data.totalTrades) * 100 : 0,
        totalTrades: data.totalTrades,
        wins: data.wins,
        losses: data.losses,
        avgDaysPerTrade: data.totalTrades > 0 ? data.totalDays / data.totalTrades : 0,
      }));

      setData(symbolPnLArray);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch symbol P&L data');
      console.error('Error fetching symbol P&L:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymbolPnL();
  }, []);

  // Filter data based on search term
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return item.symbol.toLowerCase().includes(search);
  });

  // Sort filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const handleSort = (column: keyof SymbolPnL) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Calculate totals from filtered data
  const totalPnL = filteredData.reduce((sum, item) => sum + item.pnl, 0);
  const totalTrades = filteredData.reduce((sum, item) => sum + item.totalTrades, 0);
  const totalWins = filteredData.reduce((sum, item) => sum + item.wins, 0);
  const totalLosses = filteredData.reduce((sum, item) => sum + item.losses, 0);
  const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const totalDaysAllTrades = filteredData.reduce((sum, item) => sum + (item.avgDaysPerTrade * item.totalTrades), 0);
  const overallAvgDaysPerTrade = totalTrades > 0 ? totalDaysAllTrades / totalTrades : 0;

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const SortIcon = ({ column }: { column: keyof SymbolPnL }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? (
      <TrendingUp className="h-4 w-4 text-primary" />
    ) : (
      <TrendingDown className="h-4 w-4 text-primary" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Symbols</div>
          <div className="text-3xl font-bold text-foreground">
            {filteredData.length}
            {searchTerm && data.length !== filteredData.length && (
              <span className="text-sm text-muted-foreground ml-2">/ {data.length}</span>
            )}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
          <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Overall Win Rate</div>
          <div className="text-3xl font-bold text-foreground">{overallWinRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {totalWins}W / {totalLosses}L
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
          <div className="text-3xl font-bold text-foreground">{totalTrades}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Avg Days/Trade</div>
          <div className="text-3xl font-bold text-foreground">{overallAvgDaysPerTrade.toFixed(1)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Symbol-wise P&L</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <button
            onClick={fetchSymbolPnL}
            disabled={loading}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-card rounded-lg border border-border p-12 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No P&L data available</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Symbol
                      <SortIcon column="symbol" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('pnl')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      P&L
                      <SortIcon column="pnl" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('winRate')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Win Rate %
                      <SortIcon column="winRate" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('avgDaysPerTrade')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Avg Days/Trade
                      <SortIcon column="avgDaysPerTrade" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('totalTrades')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Total Trades
                      <SortIcon column="totalTrades" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedData.map((item, index) => (
                  <tr 
                    key={item.symbol} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-foreground">{item.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-bold ${item.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-foreground">
                        {item.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.wins}W / {item.losses}L
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-foreground">{item.avgDaysPerTrade.toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-foreground">{item.totalTrades}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
