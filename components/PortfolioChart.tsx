'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PortfolioData {
  date: string;
  cumulative_value: number;
  delta: number;
  trades_count: number;
}

export default function PortfolioChart() {
  const [data, setData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const fetchPortfolioData = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('Pnl')
        .select('*')
        .order('sell_date', { ascending: true });

      if (dateRange.from) {
        query = query.gte('sell_date', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('sell_date', dateRange.to);
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Group by date and aggregate
      const groupedByDate = (fetchedData || []).reduce((acc: any, item: any) => {
        const date = item.sell_date;
        if (!acc[date]) {
          acc[date] = {
            date: date,
            delta: 0,
            trades_count: 0,
          };
        }
        acc[date].delta += item.delta;
        acc[date].trades_count += 1;
        return acc;
      }, {});

      // Convert to array and sort by date
      const aggregatedData = Object.values(groupedByDate).sort((a: any, b: any) => 
        a.date.localeCompare(b.date)
      );

      // Calculate cumulative portfolio value from aggregated delta
      let cumulative = 100000; // Starting portfolio value
      const processedData = aggregatedData.map((item: any) => {
        cumulative += item.delta;
        return {
          date: item.date,
          cumulative_value: cumulative,
          delta: item.delta,
          trades_count: item.trades_count,
        };
      });

      setData(processedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch portfolio data');
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [dateRange]);

  const currentValue = data.length > 0 ? data[data.length - 1].cumulative_value : 0;
  const initialValue = data.length > 0 ? data[0].cumulative_value : 0;
  const totalReturn = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
  const totalTrades = data.reduce((sum, item) => sum + (item.trades_count || 0), 0);
  const peakValue = data.length > 0 ? Math.max(...data.map(d => d.cumulative_value)) : 0;
  const drawdown = peakValue > 0 ? ((peakValue - currentValue) / peakValue) * 100 : 0;

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            {format(parseISO(label), 'MMM dd, yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'cumulative_value' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Current Value</div>
          <div className="text-3xl font-bold text-foreground">{formatCurrency(currentValue)}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Return</div>
          <div className={`text-3xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Peak Value</div>
          <div className="text-3xl font-bold text-foreground">{formatCurrency(peakValue)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Drawdown: {drawdown.toFixed(2)}%
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
          <div className="text-3xl font-bold text-foreground">{totalTrades}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="flex gap-2 items-end">
            {(dateRange.from || dateRange.to) && (
              <button
                onClick={() => setDateRange({ from: '', to: '' })}
                className="px-4 py-2 bg-destructive/20 text-destructive rounded-md hover:bg-destructive/30 transition-colors text-sm"
              >
                Clear Dates
              </button>
            )}
            <button
              onClick={fetchPortfolioData}
              disabled={loading}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(dateRange.from || dateRange.to) && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg text-sm">
          <span className="font-medium">Active Filters:</span>
          {dateRange.from && <span className="ml-2">From: {dateRange.from}</span>}
          {dateRange.to && <span className="ml-2">To: {dateRange.to}</span>}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="bg-card rounded-lg border border-border p-12 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No portfolio data available</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Value Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
              />
              <YAxis 
                stroke="#9ca3af"
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="cumulative_value" 
                stroke="#10b981" 
                fill="url(#colorValue)"
                name="Portfolio Value"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>

          <h3 className="text-lg font-semibold text-foreground mb-4 mt-8">Trading Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="trades_count" 
                stroke="#3b82f6" 
                name="Trades Count"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
