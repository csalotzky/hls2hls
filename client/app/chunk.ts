import {Injectable} from '@angular/core';
import {Adapter} from './adapter';

export class Chunk {
  public Path: string;
  public Resolution: string;
  public Bitrate: number;
  public BlobData: Blob;
  public FallBack: boolean;

  constructor(path, resolution, bitrate) {
    this.Path = path;
    this.Resolution = resolution;
    this.Bitrate = bitrate;
    this.FallBack = false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChunkAdapter implements Adapter<Chunk> {
  adapt(item: any): Chunk {
    return new Chunk(item.chunkItem, item.mnt.resolution, item.mnt.bitrate);
  }
}
