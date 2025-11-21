import { useEffect, useRef, useState, useCallback } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
}

interface WebSocketHookOptions {
  url: string;
  symbols: string[];
  onPriceUpdate?: (update: PriceUpdate) => void;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useWebSocket({
  url,
  symbols,
  onPriceUpdate,
  reconnectInterval = 5000,
  enabled = true,
}: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const symbolsRef = useRef<string[]>(symbols);

  // Update symbols ref when symbols change
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  const connect = useCallback(() => {
    if (!enabled || !url) {
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Subscribe to symbols
        if (symbolsRef.current.length > 0) {
          ws.send(
            JSON.stringify({
              action: 'subscribe',
              symbols: symbolsRef.current,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'price_update') {
            const update: PriceUpdate = {
              symbol: data.symbol,
              price: data.price,
              timestamp: data.timestamp || new Date().toISOString(),
            };

            // Update prices state
            setPrices((prev) => ({
              ...prev,
              [update.symbol]: update.price,
            }));

            // Call callback if provided
            if (onPriceUpdate) {
              onPriceUpdate(update);
            }
          } else if (data.type === 'error') {
            console.error('WebSocket error message:', data.message);
            setError(data.message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (enabled && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [url, enabled, reconnectInterval, onPriceUpdate]);

  // Subscribe to new symbols
  const subscribe = useCallback((newSymbols: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: 'subscribe',
          symbols: newSymbols,
        })
      );
    }
  }, []);

  // Unsubscribe from symbols
  const unsubscribe = useCallback((symbolsToRemove: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: 'unsubscribe',
          symbols: symbolsToRemove,
        })
      );
    }
  }, []);

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  // Update subscriptions when symbols change
  useEffect(() => {
    if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && symbols.length > 0) {
      // Send updated symbol list
      console.log('Updating WebSocket subscriptions:', symbols);
      wsRef.current.send(
        JSON.stringify({
          action: 'subscribe',
          symbols: symbols,
        })
      );
    }
  }, [symbols, isConnected]);

  return {
    isConnected,
    error,
    prices,
    subscribe,
    unsubscribe,
    reconnect: connect,
  };
}
