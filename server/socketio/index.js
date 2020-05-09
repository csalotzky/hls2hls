const StreamHostHelper = require('../services/stream-host-service');

module.exports = function SocketIOServer(server) {
    const io = require('socket.io')(server, { wsEngine: 'ws' });
    io.on('connection', function(client) {
        console.log('SOCKET.IO | Client connected: ' + client.id);

        client.on('join', function(data) {
            console.log('SOCKET.IO | Client joinded: ' + data);
        });

        client.on('signal', function(data) {
            var remoteClient = io.sockets.connected[data.remoteId];
            if (!remoteClient) { console.log('REMOTE CLIENT NOT FOUND: ' + data.remoteId); return; }
            console.log('SOCKET.IO | Proxying signal from peer %s to %s', client.id, remoteClient.id);
            remoteClient.emit('signal', data);
        });

        client.on('disconnect', (reason) => {
            console.log('SOCKET.IO | Client disconnected: ' + client.id + ', ' + reason);
            StreamHostHelper.clearAcksByUser(client.id);
        });
    });
}