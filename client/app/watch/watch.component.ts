import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StreamService } from '../stream.service';
import { ChunkService } from '../chunk.service';
import { isNotNullOrUndefined } from 'codelyzer/util/isNotNullOrUndefined';
import { Stream } from '../stream';
import { Mount } from '../mount';

declare var Hls;

let globalChunkService: any;

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.css']
})
export class WatchComponent implements OnInit {

  constructor(private streamService: StreamService, public chunkService: ChunkService, private route: ActivatedRoute) { 
    globalChunkService = this.chunkService; 
  }

  public SelectedStream: Stream;
  public SelectedMount: Mount;

  // Custom loader for HLS.JS
  private hlsConfig = {
    pLoader: function(config) {
    let loader = new Hls.DefaultConfig.loader(config);
    this.abort = () => loader.abort();
    this.destroy = () => loader.destroy();
    this.load = (context, config, callbacks) => {
      console.log('HLS PLOADER: Custom playlist loader called');
      globalChunkService.getChunksM3U().subscribe(
        (m3uData) => {
          console.log('HLS PLOADER: M3U playlist downloaded, injecting to player...');
          context.url = URL.createObjectURL(m3uData);
          loader.load(context, config, callbacks);
        },
        (error) => {
          console.error(error);
          loader.abort();
        }
      );
    };
  },
  fLoader:
      function(config) {
        let loader = new Hls.DefaultConfig.loader(config);
        this.abort = () => { loader.abort(); }
        this.destroy = () => loader.destroy();
        this.load = (context, config, callbacks) => {
          //If something fatal happening (chunkservice dont call back) -> set timeout and terminate loader session
          setTimeout(() => loader.load(context, config, callbacks), 30000);
 
          // update local chunks
          globalChunkService.updateChunksArray(function(){
            // chunks updated, parse chunk from url
            const chunk = globalChunkService.getChunkFromPath(context.url);
            console.log('HLS FLOADER: Custom chunk loader called for: ' + chunk.Path);

            // if no valid chunk found -> abort loader
            if (isNotNullOrUndefined(chunk)) {
              globalChunkService.getChunkBlob(chunk, function(blobUrl){
              console.log('HLS FLOADER: Chunk downloaded, injecting to player...');
              context.url = blobUrl;
              loader.load(context, config, callbacks);
            });
            } else {
              loader.abort();
            }
          });
        };
      }
  };

  // Init new HLS.JS
  private hls = new Hls(this.hlsConfig);

  // Init selected stream and mount. Init M3U
  getStream(id: number) {
    this.streamService.getStream(id).subscribe(
      (data) => {
        this.SelectedStream = data;
        this.SelectedMount = this.SelectedStream.mounts[0];
        this.chunkService.setStreamAndMount(this.SelectedStream, this.SelectedMount);
        this.chunkService.getChunksM3U().subscribe(m3uData => {
          this.hls.loadSource(URL.createObjectURL(m3uData));
        });
      },
      (error) => {
        console.error(error);
      }
    );
  }

  // Switch mount
  selectMount(mnt: Mount) {
    this.SelectedMount = mnt;
    this.chunkService.setStreamAndMount(this.SelectedStream, this.SelectedMount);
    // TODO: This should redownload already downloaded chunk on mount switch. Should redesign Chunk Service to make it work properly
    //this.hls.currentLevel = 0;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params.id != null) {
        //Params parsed -> Init everything
        this.getStream(params.id);

        //Init HLS.JS
        if (Hls.isSupported()) {
          this.hls.attachMedia(document.getElementById('video'));
          this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS: MAINFEST PARSED');
          });
        }
      }
    });
  }
}

