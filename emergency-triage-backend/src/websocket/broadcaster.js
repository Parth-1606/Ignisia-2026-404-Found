/**
 * WEBSOCKET BROADCASTER
 * 
 * Manages WebSocket connections and broadcasts real-time events
 * to all connected dispatch dashboard clients.
 *
 * Events emitted:
 *   - DISPATCH_PROGRESS    : Triage/routing in progress
 *   - DISPATCH_COMPLETE    : Patient routed, hospital assigned
 *   - PATIENT_REROUTED     : Mid-journey hospital change
 *   - HOSPITAL_CAPACITY    : Hospital capacity update
 *   - MCE_BATCH_STARTED    : Mass casualty batch routing started
 *   - MCE_BATCH_COMPLETE   : Batch routing complete
 */

const { WebSocketServer } = require('ws');

let wss = null;
let broadcastFn = null;

const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[WebSocket] Client connected from ${clientIp} | Total: ${wss.clients.size}`);

    // Send welcome message with current server time
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Emergency Triage Dispatch System — WebSocket Active',
      timestamp: new Date().toISOString(),
      clientCount: wss.clients.size,
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON message' }));
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected | Remaining: ${wss.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message);
    });
  });

  // Define broadcast function
  broadcastFn = (payload) => {
    const message = JSON.stringify({ ...payload, timestamp: new Date().toISOString() });
    let sent = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
        sent++;
      }
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebSocket] Broadcast '${payload.type}' to ${sent} client(s)`);
    }
  };

  console.log('[WebSocket] Server initialized at /ws');
  return wss;
};

/**
 * Handle messages FROM the dashboard client
 */
const handleClientMessage = (ws, message) => {
  switch (message.type) {
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      break;
    case 'SUBSCRIBE_HOSPITAL':
      // Future: subscribe to specific hospital updates
      ws.send(JSON.stringify({ type: 'SUBSCRIBED', hospitalId: message.hospitalId }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'UNKNOWN_MESSAGE', received: message.type }));
  }
};

/**
 * Get broadcaster function — used by services to emit events
 */
const getWebSocketBroadcaster = () => {
  if (!broadcastFn) {
    // Return a no-op if WebSocket not yet initialized
    return (payload) => {
      console.log('[WebSocket] Broadcast attempted before init:', payload.type);
    };
  }
  return broadcastFn;
};

const getConnectedClientCount = () => (wss ? wss.clients.size : 0);

module.exports = { initWebSocket, getWebSocketBroadcaster, getConnectedClientCount };
