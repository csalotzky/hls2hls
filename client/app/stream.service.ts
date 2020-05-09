import { Injectable } from '@angular/core';
import { Stream, StreamAdapter } from './stream';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Mount } from './mount';
import { Chunk, ChunkAdapter } from './chunk';

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  private baseUrlStreams = '/api/streams';
  private baseUrlUsers = '/api/users';

  constructor(private http: HttpClient, private streamAdapter: StreamAdapter, private chunkAdapter: ChunkAdapter) {}

  listStreams(): Observable<Stream[]> {
    const url = `${this.baseUrlStreams}/`;
    return this.http.get(url)
      .pipe(
        map((data: any[]) => data.map(item => this.streamAdapter.adapt(item)))
      );
  }

  getStream(id: number): Observable<Stream> {
    const url = `${this.baseUrlStreams}/${id}`;
    return this.http.get(url)
    .pipe(
      map((data: any) => this.streamAdapter.adapt(data))
    );
  }

  addStream(strm: Stream): Observable<Stream> {
    const url = `${this.baseUrlStreams}/`;
    return this.http.post<Stream>(url, strm);
  }

  deleteStream(strm: Stream): Observable<Stream> {
    const url = `${this.baseUrlStreams}/${strm.id}`;
    return this.http.delete<Stream>(url);
  }

  getStreamChunks(strm: Stream, mnt: Mount): Observable<Chunk[]> {
    const url = `${this.baseUrlStreams}/${strm.id}/${mnt.path}`;
    return this.http.get(url)
      .pipe(
        map((data: any[]) => data.map(chunkItem => this.chunkAdapter.adapt({chunkItem, mnt})))
      );
  }

  getStreamM3U(strm: Stream, mnt: Mount): Observable<string> {
    const url = `${this.baseUrlStreams}/${strm.id}/${mnt.path}/m3u`;
    const requestOptions: object = {
      responseType: 'blob'
    };
    return this.http.get<string>(url, requestOptions);
  }

  setPeerCredentials(socketid: string): Observable<any> {
    const url = `${this.baseUrlUsers}/authStream`;
    return this.http.post<any>(url, {socketid: socketid});
  }
}
