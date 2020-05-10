import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chunk } from './chunk';
import { Stream } from './stream';
import { Mount } from './mount';
import { StreamService } from './stream.service';
import { isNullOrUndefined } from 'util';
import { BehaviorSubject, Subject } from 'rxjs';
import { Acknowledgement } from './acknowledgement';
import { PeerService } from './peer.service';

import 'webrtc-adapter';
import { Socket } from 'ngx-socket-io';

declare var SimplePeer;

@Injectable({
  providedIn: 'root'
})
export class ChunkService {

  constructor(private http: HttpClient, private streamService: StreamService, private socket: Socket) {
    this.peerService = new PeerService(this.socket, this, this.streamService);
  }

  public token: any;
  public chunks: any;
  public selectedStream: any;
  public selectedMount: any;
  public statsSource: any;  
  public statsPeer: any;
  private peerService: any;
  private baseUrlStreams = '/api/streams';
  private baseUrlAck = '/api/acknowledgements'
  
  // Sets stream and mount
  setStreamAndMount(strm: Stream, mnt: Mount) {
    console.log('CHUNKSERVICE: setStreamAndMount called');
    this.selectedStream = strm;
    this.selectedMount = mnt;
    this.statsSource = {
      total: {count: 0, bytes: 0}, 
      fromServer: {count: 0, bytes: 0}, 
      fromP2P: {count: 0, bytes: 0}, 
      fromLegacy: {count: 0, bytes: 0}}
    this.statsPeer = [];
  }

  // Update chunks array, calls back when ready
  updateChunksArray(callback: (err) => void) {
    console.log('CHUNKSERVICE: updateChunksArray called');
    this.streamService.getStreamChunks(this.selectedStream, this.selectedMount).subscribe(
      (data) => {
        // first init
        if (isNullOrUndefined(this.chunks)) {
          this.chunks = data;
        }
        else {
          // clear local array if no chunks available
          if (data.length == 0) {
            this.chunks = null;
          }
          // phew, we have chunks
          else {
            // rewrite local chunks with new chunks, but keep blobdatas 
            var newChunks = data;
            newChunks.forEach(chnk => {
              var index = this.chunks.map((c) => c.Path).indexOf(chnk.Path) 
              if (index !== -1) {
                chnk.BlobData = this.chunks[index].BlobData;
              }
            });
            this.chunks = newChunks;
          }
        }
        // alert that chunks initialized or updated
        callback(null);
        //console.log(this.chunks);
      },
      (error) => {
        // alert even if failed
        callback(error)
        console.error(error);
      }
    );
  }

  // Gets M3U
  getChunksM3U() {
    console.log('CHUNKSERVICE: getChunksM3U called');
    return this.streamService.getStreamM3U(this.selectedStream, this.selectedMount);
  }

  // Univarsal method for getting a stream chunk, callback: url (blob) of the chunk (empty blob if error occured)
  getChunkBlob(chnk: Chunk, callback: (url) => void) {
    console.log('CHUNKSERVICE: getChunkBlob called: ' + chnk.Path);
    const ref = this;
    // Chek if chunk has already been downloaded
    if (chnk.BlobData) {
      console.warn("Chunk already downloaded: " + chnk.Path);
      callback(URL.createObjectURL(chnk.BlobData));
    } else {
    const url = `${this.baseUrlStreams}/${this.selectedStream.id}/${this.selectedMount.path}/${chnk.Path}`;
    const header = new HttpHeaders().set("Authorization", "Bearer " + this.token);
    // Try to get chunk from server
    this.http.get<string>(url, {headers: header, responseType: 'blob' as 'json' }).subscribe(
      // Success -> save chunk, ack, callback
      (data) => {
        chnk.BlobData = data as any;
        ref.makeAck("SERVER", chnk.Path);
        ref.addStatSource(chnk.BlobData.size, 'fromServer');
        callback(URL.createObjectURL(chnk.BlobData));
      },
      // Server rejected request (probably) -> switch to P2P
      (error) => {
        console.error(error);
        console.log("CHUNKSERVICE: Server rejected chunk request. Switching to WebRTC...");
        this.getChunkBlobP2P(chnk, function(err, blob, peerId){
          if (!err) { 
            // getChunkBlobP2P returned with data -> save chunk, ack, callback
            chnk.BlobData = blob;
            ref.makeAck(peerId, chnk.Path);
            ref.addStatSource(chnk.BlobData.size, 'fromP2P');
            ref.addStatPeer(chnk.BlobData.size, 0, peerId);
            callback(URL.createObjectURL(chnk.BlobData));
          } else {
            // P2P failed, try to get legacy chunk if available
            console.error(err);
            console.log("CHUNKSERVICE: WebRTC communcation failed. Trying to get legacy chunk...");
            ref.getChunkBlobLegacy(chnk, function(err, blob){
              if (!err) {
                // DON'T make ack 
                chnk.FallBack = true;
                chnk.BlobData = blob;
                ref.addStatSource(blob.size, 'fromLegacy');
                callback(URL.createObjectURL(chnk.BlobData));
              } else {
                console.error(err);
                callback(URL.createObjectURL(new Blob()));
              }
            })
          }
        });
      });
    }
  }

  // Gets legacy chunk for given stream (Failover), calls back with chunk blob
  getChunkBlobLegacy(chnk: Chunk, callback: (err, blob) => void) {
    console.log('CHUNKSERVICE: getChunkBlobLegacy called: ' + chnk.Path);
    const legacyMount = this.selectedStream.mounts.filter(m => m.legacy)[0].path;
    const url = `${this.baseUrlStreams}/${this.selectedStream.id}/${legacyMount}/${chnk.Path}`;
    this.http.get<string>(url, {responseType: 'blob' as 'json' }).subscribe(
      (data) => {
        callback(null, data);
      },
      (error) => {
        callback(error, null);
      }
    );
  }

  // Get chunk via P2P, calls back with chunk blob
  getChunkBlobP2P(chnk: Chunk, callback: (err, blob, peerId) => void) {
    console.log('CHUNKSERVICE: getChunkBlobP2P called: ' + chnk.Path);
    const streamId = this.selectedStream.id;
    const mountPath = this.selectedMount.path;
    const peerServiceRef = this.peerService;

    // Gets 'Who has this chunk' from server
    const url = `${this.baseUrlStreams}/${streamId}/${mountPath}/${chnk.Path}/peer`;
    this.http.get<any[]>(url).subscribe(
      (peers) => {
        callPeerServiceRecursive(peers);
      },
      (error) => {
        callback(error, null, null);
    });

    // Loop through peers array recursively. Return (callback) if chunk downloaded or peers emptied
    function callPeerServiceRecursive(peers) {
      if (peers.length) {
        peerServiceRef.createRequest({stream: streamId, mount: mountPath, file: chnk.Path}, peers[0].uuid, function(err, res){
          if (err) {
           console.log(err);
           peers.shift();
           callPeerServiceRecursive(peers)
          } else {
            callback(null, res, peers[0].uuid);
          }
        });
      }
      else  {
        callback('CHUNKSERVICE: Couldn\'t get via P2P: ' + chnk.Path, null, null);
      }
    }
  }

  // Parse chunk from M3U url
  getChunkFromPath(path: string) {
    const strippedPathArray = path.split('/');
    const strippedPath = strippedPathArray[strippedPathArray.length - 1];
    console.log('CHUNKSERVICE: getChunkFromPath called: ' + strippedPath);
    const resultIndex = this.chunks.map((c) => c.Path).indexOf(strippedPath);
    if (resultIndex >= 0) {
      return this.chunks[resultIndex];
    } else {
      return null;
    }
  }

  // Alerts server when a chunk has been successfully parsed
  makeAck(sourceUuid: string, filename: string) {
    console.log('CHUNKSERVICE: makeAck called: got ' + filename + ' from ' + sourceUuid);
    const header = new HttpHeaders().set("Authorization", "Bearer " + this.token);
    this.http.post<Acknowledgement>(
      this.baseUrlAck, 
      new Acknowledgement(sourceUuid, this.selectedStream.id, this.selectedMount.path, filename), {headers: header }).subscribe();
  }

  // Incerement stats
  addStatSource(bytes: number, destination) {
    this.statsSource.total.count++;
    this.statsSource.total.bytes += bytes;
    this.statsSource[destination].count++;
    this.statsSource[destination].bytes += bytes;
  }

  addStatPeer(downloadBytes: number, uploadBytes: number, remoteId: string) {
    var selectedPeer = this.statsPeer.filter(p=> p.peerId == remoteId)[0];
    var downCount = downloadBytes? 1 : 0;
    var upCount = uploadBytes? 1 : 0;
    
    if (isNullOrUndefined(selectedPeer)) {
      this.statsPeer.push({peerId: remoteId, downloadBytes: downloadBytes, downloadCount: downCount, uploadBytes: uploadBytes, uploadCount: upCount});
    } else {
      selectedPeer.downloadBytes += downloadBytes; 
      selectedPeer.downloadCount += downCount;
      selectedPeer.uploadBytes += uploadBytes;
      selectedPeer.uploadCount += upCount;
    }
  }
}
