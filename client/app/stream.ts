import { Mount, MountAdapter } from './mount';
import { Injectable } from '@angular/core';
import { Adapter } from './adapter';
import { map } from 'rxjs/operators';


export class Stream {
  public id: string;
  public name: string;
  public description: string;
  public mounts: Mount[];

  constructor(id, name, description, mounts) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.mounts = mounts;
  }
}

@Injectable({
    providedIn: 'root'
  })
  export class StreamAdapter implements Adapter<Stream> {
    constructor(private mountAdapter: MountAdapter) {}

    adapt(item: any): Stream {
      return new Stream(item.id, item.name, item.description, item.mounts.map((data: any[]) => this.mountAdapter.adapt(data)));
    }
  }

