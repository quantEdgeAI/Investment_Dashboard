# WebSocket Integration for Real-time Price Updates

## Overview

The dashboard now supports real-time price updates via WebSocket connection. This eliminates the need to frequently update the `curr_price` field in the `OpenPositions` table, which was a poor design pattern. Instead, the backend service writes the position data once, and the dashboard receives live price updates through WebSocket streaming.

## Architecture

### Frontend Components

1. **`useWebSocket` Hook** (`lib/useWebSocket.ts`)
   - Custom React hook that manages WebSocket connections
   - Handles automatic reconnection on connection loss
   - Manages symbol subscriptions dynamically
   - Provides real-time price updates via state

2. **`OpenPositions` Component** (`components/OpenPositions.tsx`)
   - Fetches initial position data from Supabase (one-time read)
   - Subscribes to WebSocket for real-time price updates
   - Calculates Unrealized P&L using live prices
   - Falls back to DB prices if WebSocket is unavailable
   - Shows connection status indicator (Live/Connecting)

### Backend Requirements

Your WebSocket server should implement the following protocol:

#### Connection
- URL: Configurable via `NEXT_PUBLIC_WS_URL` environment variable
- Protocol: Standard WebSocket (ws:// or wss://)

#### Message Format

**Client → Server (Subscribe to symbols):**
```json
{
  "action": "subscribe",
  "symbols": ["NIFTY24DEC21000CE", "BANKNIFTY24DEC45000PE", ...]
}
```

**Client → Server (Unsubscribe from symbols):**
```json
{
  "action": "unsubscribe",
  "symbols": ["NIFTY24DEC21000CE"]
}
```

**Server → Client (Price Update):**
```json
{
  "type": "price_update",
  "symbol": "NIFTY24DEC21000CE",
  "price": 125.50,
  "timestamp": "2024-11-17T14:54:00.000Z"
}
```

**Server → Client (Error):**
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Configuration

### Environment Variables

Add to your `.env.local` file:

```env
# WebSocket Configuration for Real-time Price Streaming
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

For production, use a secure WebSocket URL:
```env
NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws
```

### Optional Configuration

The WebSocket hook supports additional configuration:

```typescript
const { isConnected, error, prices } = useWebSocket({
  url: wsUrl,
  symbols: symbols,
  enabled: true,                    // Enable/disable WebSocket
  reconnectInterval: 5000,          // Reconnect delay in ms (default: 5000)
  onPriceUpdate: (update) => {      // Optional callback for each update
    console.log('Price update:', update);
  }
});
```

## Features

### 1. Real-time Price Updates
- Prices update automatically as they stream from the server
- No manual refresh required for price data
- Unrealized P&L recalculates instantly with new prices

### 2. Automatic Reconnection
- Automatically reconnects if connection is lost
- Configurable reconnection interval (default: 5 seconds)
- Resubscribes to symbols after reconnection

### 3. Dynamic Symbol Management
- Automatically subscribes to symbols when positions are loaded
- Updates subscriptions when positions change
- Unsubscribes when component unmounts

### 4. Graceful Fallback
- Uses DB prices if WebSocket is not configured
- Falls back to last known price if WebSocket disconnects
- Shows warning banner if WebSocket has errors

### 5. Connection Status Indicator
- **Green "Live"** icon: WebSocket connected and streaming
- **Yellow "Connecting..."** icon: WebSocket attempting to connect
- No indicator: WebSocket not configured (using DB prices)

## Implementation Example

### Backend WebSocket Server (Python Example)

```python
import asyncio
import json
import websockets
from typing import Set, Dict

class PriceStreamServer:
    def __init__(self):
        self.clients: Dict[websockets.WebSocketServerProtocol, Set[str]] = {}
    
    async def register(self, websocket):
        self.clients[websocket] = set()
        print(f"Client connected: {websocket.remote_address}")
    
    async def unregister(self, websocket):
        if websocket in self.clients:
            del self.clients[websocket]
        print(f"Client disconnected: {websocket.remote_address}")
    
    async def handle_message(self, websocket, message):
        try:
            data = json.loads(message)
            action = data.get('action')
            symbols = data.get('symbols', [])
            
            if action == 'subscribe':
                self.clients[websocket].update(symbols)
                print(f"Client subscribed to: {symbols}")
            elif action == 'unsubscribe':
                self.clients[websocket].difference_update(symbols)
                print(f"Client unsubscribed from: {symbols}")
        except Exception as e:
            await websocket.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def broadcast_price(self, symbol: str, price: float):
        """Broadcast price update to all subscribed clients"""
        message = json.dumps({
            'type': 'price_update',
            'symbol': symbol,
            'price': price,
            'timestamp': datetime.now().isoformat()
        })
        
        disconnected = []
        for websocket, symbols in self.clients.items():
            if symbol in symbols:
                try:
                    await websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            await self.unregister(websocket)
    
    async def handler(self, websocket, path):
        await self.register(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        finally:
            await self.unregister(websocket)

# Start server
async def main():
    server = PriceStreamServer()
    async with websockets.serve(server.handler, "localhost", 8080):
        print("WebSocket server started on ws://localhost:8080")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
```

### Backend WebSocket Server (Node.js Example)

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // Map<WebSocket, Set<string>>

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.set(ws, new Set());

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { action, symbols } = data;

      if (action === 'subscribe') {
        symbols.forEach(symbol => clients.get(ws).add(symbol));
        console.log('Client subscribed to:', symbols);
      } else if (action === 'unsubscribe') {
        symbols.forEach(symbol => clients.get(ws).delete(symbol));
        console.log('Client unsubscribed from:', symbols);
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

// Function to broadcast price updates
function broadcastPrice(symbol, price) {
  const message = JSON.stringify({
    type: 'price_update',
    symbol: symbol,
    price: price,
    timestamp: new Date().toISOString()
  });

  clients.forEach((symbols, ws) => {
    if (symbols.has(symbol) && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

console.log('WebSocket server started on ws://localhost:8080');

// Example: Simulate price updates
// setInterval(() => {
//   broadcastPrice('NIFTY24DEC21000CE', Math.random() * 200);
// }, 1000);
```

## Testing

### 1. Without WebSocket (Fallback Mode)
- Don't set `NEXT_PUBLIC_WS_URL` or leave it empty
- Dashboard will use prices from database
- No connection indicator will be shown

### 2. With WebSocket
- Set `NEXT_PUBLIC_WS_URL` in `.env.local`
- Start your WebSocket server
- Dashboard will show "Live" indicator when connected
- Prices will update in real-time as server broadcasts them

### 3. Connection Loss Handling
- Stop the WebSocket server while dashboard is running
- Dashboard will show "Connecting..." indicator
- Prices will fall back to last known values
- Dashboard will automatically reconnect when server is back

## Benefits

1. **Scalability**: Backend doesn't need to update database for every price tick
2. **Performance**: Reduced database writes and reads
3. **Real-time**: Instant price updates without polling
4. **Efficiency**: Only active positions receive price updates
5. **Reliability**: Graceful fallback to DB prices if WebSocket fails

## Troubleshooting

### WebSocket not connecting
- Check if `NEXT_PUBLIC_WS_URL` is set correctly
- Verify WebSocket server is running
- Check browser console for connection errors
- Ensure firewall allows WebSocket connections

### Prices not updating
- Verify WebSocket server is sending correct message format
- Check if symbols are being subscribed correctly
- Look for errors in browser console
- Confirm server is broadcasting to subscribed symbols

### Connection keeps dropping
- Check network stability
- Verify server is handling WebSocket protocol correctly
- Increase `reconnectInterval` if needed
- Check server logs for connection errors

## Future Enhancements

1. Add authentication to WebSocket connection
2. Implement heartbeat/ping-pong for connection health
3. Add price change indicators (up/down arrows)
4. Show last update timestamp for each position
5. Add option to toggle between live and DB prices
6. Implement price alerts/notifications
