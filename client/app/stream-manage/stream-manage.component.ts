import { Component, OnInit } from '@angular/core';
import { StreamService } from '../stream.service';
import { Stream } from '../stream';

@Component({
  selector: 'app-stream-manage',
  templateUrl: './stream-manage.component.html',
  styleUrls: ['./stream-manage.component.css']
})
export class StreamManageComponent implements OnInit {

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
