# WebSocket Authentication Integration

## Overview
Implemented challenge-response authentication for WebSocket connections to secure the price streaming service.

## Authentication Flow

### 1. Connection Established
```
Client connects → Server sends 'auth_required' message
```

### 2. Challenge Request
```typescript
Client → Server:
{
  "action": "authenticate",
  "auth_data": {
    "type": "request_challenge",
    "api_key": "your-secret-api-key-1"
  }
}
```

### 3. Challenge Response
```typescript
Server → Client:
{
  "type": "challenge",
  "challenge": "random-string",
  "challenge_id": "unique-id"
}
```

### 4. Sign Challenge
```typescript
// Client computes signature
signature = SHA256(challenge + ":" + api_key)
signature_base64 = base64_encode(signature)

Client → Server:
{
  "action": "authenticate",
  "auth_data": {
    "type": "challenge_response",
    "challenge_id": "unique-id",
    "signature": "base64-signature",
    "api_key": "your-secret-api-key-1"
  }
}
```

### 5. Authentication Success
```typescript
Server → Client:
{
  "type": "authenticated",
  "session_token": "session-token-string"
}
```

## Implementation Details

### Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_WS_URL=ws://your-server:3001
NEXT_PUBLIC_WS_API_KEY=your-secret-api-key-1
```

### WebSocket Context Changes

**New State:**
- `isAuthenticated`: Boolean indicating authentication status
- `sessionToken`: Session token received after successful authentication
- `authenticationInProgressRef`: Prevents duplicate authentication attempts

**Authentication Function:**
```typescript
const authenticate = async (ws: WebSocket): Promise<boolean> => {
  // 1. Wait for auth_required message
  // 2. Request challenge with API key
  // 3. Sign challenge using SHA-256
  // 4. Send signed response
  // 5. Receive session token
  // 6. Return success/failure
}
```

**SHA-256 Hashing:**
```typescript
const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return hashBase64;
}
```

### Connection Lifecycle with Authentication

1. **WebSocket Opens**
   - Connection established
   - `onopen` handler triggered

2. **Authentication Starts**
   - Wait for `auth_required` message
   - Request challenge
   - Sign challenge
   - Send response

3. **Authentication Success**
   - Receive session token
   - Set `isAuthenticated = true`
   - Resubscribe to symbols

4. **Authentication Failure**
   - Set error message
   - Close connection
   - Trigger reconnection (if enabled)

5. **Subscription Management**
   - Subscriptions only sent after authentication
   - Queued symbols subscribed after auth success

### Message Handling

**Auth Messages (handled by authenticate function):**
- `auth_required`
- `challenge`
- `authenticated`
- `auth_error`

**Data Messages (handled by onmessage):**
- `price_update`
- `error`

Auth messages are filtered out in the main `onmessage` handler to prevent duplicate processing.

## Security Features

### 1. Challenge-Response Authentication
- Server generates unique challenge for each connection
- Client must prove knowledge of API key without sending it in plain text
- Prevents replay attacks

### 2. SHA-256 Signing
- Uses browser's native `crypto.subtle.digest` API
- Secure cryptographic hashing
- Base64 encoding for transmission

### 3. Session Tokens
- Server issues session token after successful authentication
- Token can be used for subsequent requests
- Stored in component state (not persisted)

### 4. Timeout Protection
- 10-second authentication timeout
- Prevents hanging connections
- Automatic cleanup on timeout

### 5. State Management
- `authenticationInProgressRef` prevents concurrent auth attempts
- State reset on connection close
- Clean error handling

## Error Handling

### Authentication Timeout
```typescript
setTimeout(() => {
  console.error('Authentication timeout');
  setError('Authentication timeout');
  resolve(false);
}, 10000);
```

### Authentication Failure
```typescript
if (data.type === 'auth_error') {
  setError(`Authentication failed: ${data.message}`);
  setIsAuthenticated(false);
  ws.close(); // Close connection on auth failure
}
```

### Connection Errors
- WebSocket errors logged and displayed
- Automatic reconnection on non-normal closures
- Authentication state reset on disconnect

## Testing

### Valid Authentication
1. Set correct API key in `.env.local`
2. Start application
3. Check console for:
   - "WebSocket connected, starting authentication..."
   - "Requesting authentication challenge"
   - "Received challenge, signing..."
   - "Authentication successful"

### Invalid API Key
1. Set incorrect API key
2. Check console for:
   - "Authentication failed: Invalid API key"
   - Connection closes
   - Reconnection attempt

### No API Key
1. Remove API key from `.env.local`
2. Authentication skipped
3. Warning logged: "No API key provided, skipping authentication"

## Console Logs

**Successful Flow:**
```
Connecting to WebSocket: ws://...
WebSocket connected, starting authentication...
Auth message received: auth_required
Requesting authentication challenge
Auth message received: challenge
Received challenge, signing...
Auth message received: authenticated
Authentication successful
Resubscribing to symbols: ['SYMBOL1', 'SYMBOL2']
```

**Failed Flow:**
```
Connecting to WebSocket: ws://...
WebSocket connected, starting authentication...
Auth message received: auth_required
Requesting authentication challenge
Auth message received: auth_error
Authentication failed: Invalid signature
WebSocket closed: 1000
```

## Backward Compatibility

If the server doesn't require authentication:
- Set `apiKey` to empty string or undefined
- Authentication is skipped
- `isAuthenticated` set to `true` immediately
- Subscriptions work as before

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiry
2. **Token Persistence**: Store session token in localStorage for reconnections
3. **Multiple Auth Methods**: Support OAuth, JWT, etc.
4. **Rate Limiting**: Client-side rate limiting for auth attempts
5. **Audit Logging**: Log all authentication attempts for security monitoring
