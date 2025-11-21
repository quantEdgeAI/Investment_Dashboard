# WebSocket Context Migration

## Overview
Migrated WebSocket connection from component-level hook to app-level context provider to enable:
1. **Persistent connection** across tab switches
2. **Local price caching** using localStorage
3. **Efficient subscription management**

## Changes Made

### 1. Created WebSocket Context Provider
**File:** `contexts/WebSocketContext.tsx`

**Features:**
- Single persistent WebSocket connection at app level
- Automatic price caching to localStorage (24-hour expiry)
- Subscription management with symbol tracking
- Automatic resubscription on reconnect
- Cached prices loaded on initialization

**Key Functions:**
- `subscribe(symbols)` - Subscribe to price updates for symbols
- `unsubscribe(symbols)` - Unsubscribe from symbols
- `reconnect()` - Manually trigger reconnection

### 2. Updated App Page
**File:** `app/page.tsx`

**Changes:**
- Wrapped entire app with `<WebSocketProvider>`
- WebSocket URL passed from environment variable
- Connection persists across all tab switches

### 3. Updated OpenPositions Component
**File:** `components/OpenPositions.tsx`

**Changes:**
- Replaced `useWebSocket` hook with `useWebSocketContext`
- Added subscription/unsubscription on mount/unmount
- Removed local WebSocket state management
- Connection status now reflects global WebSocket state

## Benefits

### 1. Persistent Connection
- WebSocket connection maintained when switching tabs
- No reconnection overhead when navigating
- Continuous price updates across all views

### 2. Price Caching
- Prices cached in localStorage
- Cache persists across page refreshes
- 24-hour cache expiry
- Immediate price display on load (using cached values)

### 3. Efficient Subscription Management
- Components subscribe only to symbols they need
- **No unsubscribe on unmount** - subscriptions persist across tab switches
- **Duplicate prevention** - only subscribes to new symbols
- Resubscribes automatically on reconnect
- Subscriptions remain active for continuous updates

### 4. Better User Experience
- Faster tab switching (no reconnection delay)
- Prices available immediately from cache
- Smooth continuous updates
- Single connection = lower server load

## Usage in Other Components

To use WebSocket in any component:

```tsx
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function MyComponent() {
  const { isConnected, prices, subscribe } = useWebSocketContext();
  
  useEffect(() => {
    const symbols = ['SYMBOL1', 'SYMBOL2'];
    subscribe(symbols);
    
    // No cleanup - subscriptions persist across component lifecycle
    // This allows continuous updates even when switching tabs
  }, [symbols, subscribe]);
  
  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      <div>Price: {prices['SYMBOL1']}</div>
    </div>
  );
}
```

## Technical Details

### Cache Structure
```json
{
  "data": {
    "SYMBOL1": 123.45,
    "SYMBOL2": 678.90
  },
  "timestamp": 1700000000000
}
```

### Subscription Tracking
- Uses `Set<string>` to track subscribed symbols
- **Smart subscription** - only sends messages for new symbols
- **Smart unsubscription** - only sends messages for actually subscribed symbols
- Prevents duplicate subscription/unsubscription messages
- Maintains subscriptions across reconnections and tab switches

### Connection Lifecycle
1. Provider mounts → Connect to WebSocket + Load cached prices
2. Component mounts → Subscribe to symbols (only new ones)
3. Receive price updates → Update state + cache to localStorage
4. Component unmounts → **Subscriptions remain active**
5. Component remounts → No new subscription (already subscribed)
6. Provider unmounts → Close connection

## Migration Notes

### Old Pattern (Component-level)
```tsx
const { prices } = useWebSocket({ url, symbols });
```

### New Pattern (Context-level)
```tsx
const { prices, subscribe } = useWebSocketContext();

useEffect(() => {
  subscribe(symbols);
  // No cleanup - subscriptions persist
}, [symbols, subscribe]);
```

**Key Difference:** Subscriptions are now persistent and don't get cleaned up on component unmount. This enables:
- No re-subscription when switching tabs
- Continuous price updates in the background
- Reduced server load (fewer subscription messages)

## Connection Deduplication

### React Strict Mode in Development
In development mode, React 18+ intentionally runs effects twice to help detect bugs. This can cause duplicate WebSocket connections.

**Solution Implemented:**
- `connectionInProgressRef` flag prevents duplicate connections
- Checks if connection is already `CONNECTING` or `OPEN` before creating new connection
- Logs "Connection already exists or in progress, skipping..." when duplicate detected

**Console Output in Dev Mode:**
```
Connecting to WebSocket: ws://...
Connection already exists or in progress, skipping...
```

**Production Behavior:**
- No duplicate connections
- Single WebSocket connection maintained
- Clean connection lifecycle

## Future Enhancements

1. **Compression**: Add WebSocket message compression
2. **Batching**: Batch price updates for better performance
3. **Selective Updates**: Only update changed prices
4. **Cache Strategy**: Implement LRU cache for memory efficiency
5. **Offline Support**: Queue subscriptions when offline
