import { Component, OnInit } from '@angular/core';
import { StreamService } from '../stream.service';
import { Stream } from '../stream';

@Component({
  selector: 'app-stream-list',
  templateUrl: './stream-list.component.html',
  styleUrls: ['./stream-list.component.css'],
  providers: [StreamService]
})
export class StreamListComponent implements OnInit {

  public streams: any;

  constructor(private streamService: StreamService) { }

  ngOnInit() {
    this.streamService.listStreams().subscribe(data => this.streams = data);
  }

  deleteStream(strm: Stream) {
    this.streamService.deleteStream(strm).subscribe(
      (data) => { console.log(data); },
      (error) => { console.error(error); },
    );
  }

}
