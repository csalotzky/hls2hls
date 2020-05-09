import { Injectable } from '@angular/core';
import { Adapter } from './adapter';

export class Mount {
    constructor(
        public path: string,
        public resolution: string,
        public bitrate: number,
        public fileschema: string,
        public legacy: boolean
    ) {}
}


@Injectable({
    providedIn: 'root'
  })
  export class MountAdapter implements Adapter<Mount> {
    adapt(item: any): Mount {
      return new Mount(item.path, item.resolution, item.bitrate, item.fileschema, item.legacy);
    }
  }
