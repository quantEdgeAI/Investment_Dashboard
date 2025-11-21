'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  prices: Record<string, number>;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url: string;
  apiKey?: string;
  enabled?: boolean;
  reconnectInterval?: number;
}

const PRICE_CACHE_KEY = 'websocket_price_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function WebSocketProvider({ 
  children, 
  url,
  apiKey,
  enabled = true,
  reconnectInterval = 5000 
}: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    // Load cached prices from localStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(PRICE_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Check if cache is still valid
          if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
            console.log('Loaded cached prices:', Object.keys(data).length, 'symbols');
            return data;
          }
        }
      } catch (err) {
        console.error('Error loading cached prices:', err);
      }
    }
    return {};
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const authenticationInProgressRef = useRef<boolean>(false);
  const connectionInProgressRef = useRef<boolean>(false);

  // Helper function to compute SHA-256 hash
  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    return hashBase64;
  };

  // Authenticate with the WebSocket server
  const authenticate = async (ws: WebSocket): Promise<boolean> => {
    if (!apiKey) {
      console.warn('No API key provided, skipping authentication');
      setIsAuthenticated(true);
      return true;
    }

    if (authenticationInProgressRef.current) {
      console.log('Authentication already in progress');
      return false;
    }

    authenticationInProgressRef.current = true;

    return new Promise((resolve) => {
      const authTimeout = setTimeout(() => {
        console.error('Authentication timeout');
        setError('Authentication timeout');
        authenticationInProgressRef.current = false;
        resolve(false);
      }, 10000); // 10 second timeout

      const messageHandler = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Auth message received:', data.type);

          if (data.type === 'auth_required') {
            // Step 1: Request challenge
            console.log('Requesting authentication challenge');
            ws.send(JSON.stringify({
              action: 'authenticate',
              auth_data: {
                type: 'request_challenge',
                api_key: apiKey
              }
            }));
          } else if (data.type === 'challenge') {
            // Step 2: Sign challenge and respond
            console.log('Received challenge, signing...');
            const { challenge, challenge_id } = data;
            const signature = await sha256(`${challenge}:${apiKey}`);

            ws.send(JSON.stringify({
              action: 'authenticate',
              auth_data: {
                type: 'challenge_response',
                challenge_id: challenge_id,
                signature: signature,
                api_key: apiKey
              }
            }));
          } else if (data.type === 'authenticated') {
            // Step 3: Authentication successful
            console.log('Authentication successful');
            clearTimeout(authTimeout);
            ws.removeEventListener('message', messageHandler);
            setIsAuthenticated(true);
            setSessionToken(data.session_token);
            setError(null);
            authenticationInProgressRef.current = false;
            resolve(true);
          } else if (data.type === 'auth_error') {
            // Authentication failed
            console.error('Authentication failed:', data.message);
            clearTimeout(authTimeout);
            ws.removeEventListener('message', messageHandler);
            setError(`Authentication failed: ${data.message}`);
            setIsAuthenticated(false);
            authenticationInProgressRef.current = false;
            resolve(false);
          }
        } catch (err) {
          console.error('Error during authentication:', err);
          clearTimeout(authTimeout);
          ws.removeEventListener('message', messageHandler);
          setError('Authentication error');
          authenticationInProgressRef.current = false;
          resolve(false);
        }
      };

      ws.addEventListener('message', messageHandler);
    });
  };

  // Cache prices to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(prices).length > 0) {
      try {
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({
          data: prices,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Error caching prices:', err);
      }
    }
  }, [prices]);

  const connect = useCallback(() => {
    if (!enabled || !url) {
      return;
    }

    // Prevent duplicate connections (React Strict Mode in dev)
    if (connectionInProgressRef.current || 
        (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || 
                           wsRef.current.readyState === WebSocket.OPEN))) {
      console.log('Connection already exists or in progress, skipping...');
      return;
    }

    connectionInProgressRef.current = true;

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log('Connecting to WebSocket:', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('WebSocket connected, starting authentication...');
        setIsConnected(true);
        setError(null);
        connectionInProgressRef.current = false; // Connection established

        // Authenticate before subscribing
        const authSuccess = await authenticate(ws);

        if (authSuccess) {
          // Resubscribe to previously subscribed symbols after authentication
          if (subscribedSymbolsRef.current.size > 0) {
            const symbols = Array.from(subscribedSymbolsRef.current);
            console.log('Resubscribing to symbols:', symbols);
            ws.send(
              JSON.stringify({
                action: 'subscribe',
                symbols: symbols,
              })
            );
          }
        } else {
          console.error('Authentication failed, closing connection');
          ws.close();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Skip auth messages (handled by authenticate function)
          if (data.type === 'auth_required' || data.type === 'challenge' || 
              data.type === 'authenticated' || data.type === 'auth_error') {
            return;
          }
          
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
        connectionInProgressRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsAuthenticated(false);
        setSessionToken(null);
        authenticationInProgressRef.current = false;
        connectionInProgressRef.current = false;
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
      connectionInProgressRef.current = false;
    }
  }, [url, apiKey, enabled, reconnectInterval]);

  // Subscribe to symbols
  const subscribe = useCallback((symbols: string[]) => {
    if (symbols.length === 0) return;

    // Filter out symbols that are already subscribed
    const newSymbols = symbols.filter(symbol => !subscribedSymbolsRef.current.has(symbol));
    
    if (newSymbols.length === 0) {
      // All symbols already subscribed, no need to send message
      return;
    }

    // Add new symbols to subscribed set
    newSymbols.forEach(symbol => subscribedSymbolsRef.current.add(symbol));

    // Send subscription if connected and authenticated (only for new symbols)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAuthenticated) {
      console.log('Subscribing to new symbols:', newSymbols);
      wsRef.current.send(
        JSON.stringify({
          action: 'subscribe',
          symbols: newSymbols,
        })
      );
    } else if (!isAuthenticated) {
      console.log('Waiting for authentication before subscribing to:', newSymbols);
    }
  }, [isAuthenticated]);

  // Unsubscribe from symbols
  const unsubscribe = useCallback((symbols: string[]) => {
    if (symbols.length === 0) return;

    // Filter to only symbols that are actually subscribed
    const subscribedToRemove = symbols.filter(symbol => subscribedSymbolsRef.current.has(symbol));
    
    if (subscribedToRemove.length === 0) {
      // None of these symbols are subscribed
      return;
    }

    // Remove from subscribed symbols set
    subscribedToRemove.forEach(symbol => subscribedSymbolsRef.current.delete(symbol));

    // Send unsubscription if connected and authenticated
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAuthenticated) {
      console.log('Unsubscribing from symbols:', subscribedToRemove);
      wsRef.current.send(
        JSON.stringify({
          action: 'unsubscribe',
          symbols: subscribedToRemove,
        })
      );
    }
  }, [isAuthenticated]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Provider unmounting');
      }
    };
  }, [connect]);

  const value: WebSocketContextType = {
    isConnected,
    error,
    prices,
    subscribe,
    unsubscribe,
    reconnect: connect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
