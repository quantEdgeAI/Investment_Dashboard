'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Position {
  orderid: number;
  tradingsymbol: string;
  side: string;
  quantity: number;
  buy_price: number;
  curr_price: number;
  date: string;
  delta?: number;
}

export default function OpenPositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use WebSocket context for persistent connection
  const { isConnected, error: wsError, prices, subscribe } = useWebSocketContext();

  // Extract unique symbols from positions for WebSocket subscription
  // Only update when the actual symbol list changes, not when position objects change
  const symbols = useMemo(() => {
    const symbolList = positions.map((pos) => pos.tradingsymbol);
    return Array.from(new Set(symbolList)); // Remove duplicates
  }, [positions.map(p => p.tradingsymbol).join(',')]);

  // Subscribe to symbols when they change
  // Keep track of previous symbols to only unsubscribe from removed ones
  useEffect(() => {
    if (symbols.length > 0) {
      console.log('OpenPositions subscribing to:', symbols);
      subscribe(symbols);
    }
    // No cleanup - keep subscriptions active even when component unmounts
    // This allows prices to continue updating when switching tabs
  }, [symbols, subscribe]);

  const fetchOpenPositions = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('OpenPositions')
        .select('*')
        .order('date', { ascending: false });

      console.log('Fetch result:', { data, fetchError });

      if (fetchError) throw fetchError;

      // Store positions with initial curr_price from DB
      const positionsWithDelta = (data || []).map((pos: any) => {
        console.log('Processing position:', pos);
        console.log('Side:', pos.side, 'Buy Price:', pos.buy_price, 'Curr Price:', pos.curr_price, 'Qty:', pos.quantity);
        
        // For buy positions: profit when curr_price > buy_price
        // For sell positions: profit when buy_price > curr_price
        const delta = pos.side.toLowerCase() === 'buy'
          ? (pos.curr_price - pos.buy_price) * pos.quantity
          : (pos.buy_price - pos.curr_price) * pos.quantity;

        console.log('Calculated delta:', delta);

        return {
          ...pos,
          delta,
        };
      });

      console.log('Positions with delta:', positionsWithDelta);
      setPositions(positionsWithDelta);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch open positions');
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenPositions();
  }, []);

  // Calculate positions with real-time prices from WebSocket
  const positionsWithRealtimePrices = useMemo(() => {
    return positions.map((pos) => {
      // Use WebSocket price if available, otherwise fall back to DB price
      const currentPrice = prices[pos.tradingsymbol] ?? pos.curr_price;
      
      // Recalculate delta with real-time price
      const delta = pos.side.toLowerCase() === 'buy'
        ? (currentPrice - pos.buy_price) * pos.quantity
        : (pos.buy_price - currentPrice) * pos.quantity;

      return {
        ...pos,
        curr_price: currentPrice,
        delta,
      };
    });
  }, [positions, prices]);

  const totalDelta = positionsWithRealtimePrices.reduce((sum, pos) => sum + (pos.delta || 0), 0);
  const totalValue = positionsWithRealtimePrices.reduce((sum, pos) => sum + pos.curr_price * pos.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Open Positions</div>
          <div className="text-3xl font-bold text-foreground">{positions.length}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Value</div>
          <div className="text-3xl font-bold text-foreground">
            ₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Unrealized P&L</div>
          <div className={`text-3xl font-bold ${totalDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalDelta >= 0 ? '+' : ''}₹{totalDelta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Position Details</h2>
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-500">Connecting...</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={fetchOpenPositions}
          disabled={loading}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {wsError && (
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-600 px-4 py-3 rounded-lg">
          WebSocket: {wsError} (Using last known prices)
        </div>
      )}

      {/* Positions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : positionsWithRealtimePrices.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No open positions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positionsWithRealtimePrices.map((position) => (
            <div key={position.orderid} className="bg-card rounded-lg border border-border p-4 hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">{position.tradingsymbol}</h3>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(position.date), 'dd-MM-yyyy')}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    position.side === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {position.side.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  {(position.delta || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="text-foreground font-medium">{position.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buy Price:</span>
                  <span className="text-foreground font-medium">₹{position.buy_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="text-foreground font-medium">₹{position.curr_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Unrealized P&L:</span>
                  <span className={`font-bold ${(position.delta || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(position.delta || 0) >= 0 ? '+' : ''}₹{(position.delta || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
