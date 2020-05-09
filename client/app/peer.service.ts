import { ChunkService } from './chunk.service';
import { Socket } from 'ngx-socket-io';
import { StreamService } from './stream.service';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';
import 'webrtc-adapter';

declare var SimplePeer;

export class PeerService {
    constructor(private socket: Socket, private chunkService: ChunkService, private streamService: StreamService) {
        var chunkServiceRef = this.chunkService;
        var slavePeers = [];
        socket.on('connect', function(data) {   
            // Init SocketIO
            this.peerId = socket.ioSocket.id;
            console.log('SOCKET.IO: Connected to server, ID: ', socket.ioSocket.id);
            socket.emit('join', 'Joined');
            
            // Get ID from SOCKETIO -> Send it to server and get token
            streamService.setPeerCredentials(this.peerId).subscribe(data => {
              chunkServiceRef.token = data.user?.token;
              console.log('CHUNKSERVICE: PeerCredentials received');
            }); 
            
            // Catch signal from remote master peers (proxied by socket.io)
            socket.ioSocket.on('signal', function(remoteData) {
              // Only catch signals addressed to slave peers
              if (remoteData.toSlave) {
                const selectedPeer = slavePeers.filter(p => p.id == remoteData.sourceId)[0];
                if (isNotNullOrUndefined(selectedPeer)) {
                    // Slavepeer already exists -> just send signal to local slavepeer
                    //console.log("PEER SLAVE: Send remote masterpeers signal to existing local slavepeer");
                    selectedPeer.peer.signal(remoteData.signal);
                } else {
                    // Generate new slavepeer. Subscribe to events 
                    console.log("PEER SLAVE: Generate new slavepeer");
                    var newPeer = new SimplePeer({
                        channelConfig: { reliable: true, ordered: true },
                        config: {iceServers: [{
                            urls: [ "stun:eu-turn6.xirsys.com" ]
                         }, {
                            username: "Y2kRP0dCMiF3JE9wg-mAQ1wlmRkxro9g6ZNVMdzyfIyt3oGel2Ij_GEqug6Os0E3AAAAAF6zHXxjc2Fsb3R6a3k=",
                            credential: "e243b3b4-8fd7-11ea-b8cb-02ca4b67e38f",
                            urls: [
                                "turn:eu-turn6.xirsys.com:80?transport=udp",
                                "turn:eu-turn6.xirsys.com:3478?transport=udp",
                                "turn:eu-turn6.xirsys.com:80?transport=tcp",
                                "turn:eu-turn6.xirsys.com:3478?transport=tcp",
                                "turns:eu-turn6.xirsys.com:443?transport=tcp",
                                "turns:eu-turn6.xirsys.com:5349?transport=tcp"
                            ]
                         }]
                        }
                    });
                    // When the local slavepeer generates signal -> Send back to remote master via socket.io
                    newPeer.on('signal', data => {
                        //console.log("PEER SLAVE: Slavepeer's signal generated. Send back to remote masterpeer");
                        socket.emit('signal', {
                          signal: data,
                          sourceId: socket.ioSocket.id,
                          remoteId: remoteData.sourceId, //from.socket.io signal data.source
                          toSlave: false
                        });
                      });
                    newPeer.on('data', data => {
                      // Got a data from remote masterpeer -> send back chunk data
                        var request = JSON.parse(data);
                        console.log('PEER SLAVE: Requested chunk: ' + request.file);
                        // TODO: When user switches stream, some useful chunks remain in chunks array. This condition will give false negative (for a few chunk) in that case
                        if (chunkServiceRef.selectedStream.id == request.stream && chunkServiceRef.selectedMount.path == request.mount) {
                            var result = chunkServiceRef.chunks.filter(c => c.Path == request.file && !c.FallBack)[0];
                            if (isNotNullOrUndefined(result)) {
                                console.log("PEER SLAVE: Requested chunk found. Sending to remote masterpeer.")
                                // Chunk found. Sent to remote peer
                                result.BlobData.arrayBuffer()
                                .then(buffer => {
                                  // Max. 16k
                                  const chunkSize = 16 * 1024;
                                  // Keep chunking, and sending the chunks to the other peer
                                  while(buffer.byteLength) {
                                    const chunk = buffer.slice(0, chunkSize);
                                    buffer = buffer.slice(chunkSize, buffer.byteLength);
                                    
                                    // Send chunk (of chunk)!
                                    newPeer.send(chunk);
                                  }
                                  // End message to signal that all chunks have been sent
                                  newPeer.send(0);
                                  chunkServiceRef.addStatPeer(0, result.BlobData.size, remoteData.sourceId);
                                  console.log("PEER SLAVE: Sending finished.")
                                });
                            }
                            else { newPeer.destroy(); }
                        } else { newPeer.destroy(); }
                    });

                    newPeer.on('connect', () => {
                        console.log("PEER SLAVE: Peers connected");
                    });

                    newPeer.on('error', err => {
                        //console.error("PEER SLAVE: ERROR", err);
                        slavePeers = slavePeers.filter(p => p.id != remoteData.sourceId);
                    });

                    newPeer.on('close', () => {
                        console.log("PEER SLAVE: Session closed");
                        slavePeers = slavePeers.filter(p => p.id != remoteData.sourceId);

                    });

                    // Send signal to local slavepeer
                    //console.log("PEER SLAVE: Send remote masterpeers signal to new local slavepeer");
                    newPeer.signal(remoteData.signal);
                    slavePeers.push({id: remoteData.sourceId, peer: newPeer});
                }
              } 
            });  
          });
    }

    public createRequest(chunkRequest, remoteId, callback: (err, res) => void) {
        console.log("PEER MASTER: createRequest called: ", chunkRequest);
        var socketId = this.socket.ioSocket.id;
        var socketRef = this.socket;
        var buffer = []
        var endSignal = new TextEncoder().encode("0");
        if (remoteId == socketId) {
            console.log("PEER MASTER: Invalid request, remote ID can't be the local ID");
            callback('Invalid request', null);
        } else {
            var masterPeer = new SimplePeer({ initiator: true,
                channelConfig: { reliable: true, ordered: true },
                config: {
                iceServers: [{ urls: [ "stun:eu-turn6.xirsys.com" ]}, {
                    username: "Y2kRP0dCMiF3JE9wg-mAQ1wlmRkxro9g6ZNVMdzyfIyt3oGel2Ij_GEqug6Os0E3AAAAAF6zHXxjc2Fsb3R6a3k=",
                    credential: "e243b3b4-8fd7-11ea-b8cb-02ca4b67e38f",
                    urls: [
                        "turn:eu-turn6.xirsys.com:80?transport=udp",
                        "turn:eu-turn6.xirsys.com:3478?transport=udp",
                        "turn:eu-turn6.xirsys.com:80?transport=tcp",
                        "turn:eu-turn6.xirsys.com:3478?transport=tcp",
                        "turns:eu-turn6.xirsys.com:443?transport=tcp",
                        "turns:eu-turn6.xirsys.com:5349?transport=tcp"
                    ]
                 }]
                }
            });
            // Register to masterpeers signal event -> send to remote slavepeer via socket.io
            masterPeer.on('signal', data => {
                //console.log("PEER MASTER: Masterepeer's signal generated. Send to remote slavepeer");
                this.socket.emit('signal', {
                    signal: data,
                    sourceId: this.socket.ioSocket.id,
                    remoteId: remoteId, //from api
                    toSlave: true
                });
            });

            // Peers connected -> send requested chunk details
            masterPeer.on('connect', () => {
                console.log("PEER MASTER: Peers connected");
                clearTimeout(connectionTimeout);
                masterPeer.send(JSON.stringify(chunkRequest));
            });

            // Chunk received -> disconnect session
            masterPeer.on('data', data => {
                // wait for 'connect' event before using the data channel
                if (data.length === 1 && data[0] === endSignal[0]) {
                    console.log("PEER MASTER: Chunk downloaded: ", chunkRequest);
                    clearTimeout(dataTimeout);
                    endSession();
                    callback(null, new Blob(buffer));
                } else {
                    buffer.push(data);
                }
            });

            masterPeer.on('close', () => {
                console.log("PEER MASTER: Session closed");
                endSession();
            });

            // Unknown error
            masterPeer.on('error', err => {
                console.error(err);
                endSession();
                callback(err, null);
            });

            // Catch signal from remote slave peer (proxied by socket.io)
            var socketListener = function(data) {
                if (!data.toSlave && data.remoteId == socketId) {
                    //console.log("PEER MASTER: Send remote slavepeers signal to local masterpeer");
                    masterPeer.signal(data.signal);
                }
            }
            this.socket.ioSocket.on('signal', socketListener);

            // Terminate session if timeout
            var connectionTimeout = setTimeout(function(){ callback('WebRTC Connection timeout', null); }, 5000)
            var dataTimeout = setTimeout(function(){ callback('WebRTC Data timeout', null); }, 20000)

            // Destroy tasks
            function endSession() {
                masterPeer.destroy();
                socketRef.ioSocket.off('signal', socketListener);
            }
        }
    }
}
