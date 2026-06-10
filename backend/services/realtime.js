const WebSocket = require('ws');

let server;

function initializeRealtime(httpServer) {
  server = new WebSocket.Server({ server: httpServer, path: '/ws' });

  server.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        type: 'connected',
        message: 'Realtime updates connected',
      })
    );
  });

  return server;
}

function broadcast(type, payload) {
  if (!server) return;

  const message = JSON.stringify({
    type,
    payload,
    sentAt: new Date().toISOString(),
  });
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { initializeRealtime, broadcast };
