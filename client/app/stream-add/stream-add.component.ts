import { Component, OnInit } from '@angular/core';
import { StreamService } from '../stream.service';
import { Stream } from '../stream';
import { Mount } from '../mount';

@Component({
  selector: 'app-stream-add',
  templateUrl: './stream-add.component.html',
  styleUrls: ['./stream-add.component.css'],
  providers: [StreamService]
})
export class StreamAddComponent implements OnInit {

  stream = new Stream('', '', '', []);
  submitted = false;
  error = false;
  errorMsg = '';

  constructor(private streamService: StreamService) {  }

  ngOnInit() {
    this.submitted = false;
    this.error = false;
  }

  addStream() {
    console.log(this.stream);
    this.submitted = false;
    this.error = false;
    this.streamService.addStream(this.stream).subscribe(
        (data) => { this.submitted = true; },
        (error) => { this.error = true; this.errorMsg = error.message; console.error(error); },
      );
  }

  getStream() {

  }

  addMount() {
    this.stream.mounts.push(new Mount('', '', 0, 'index', false));
  }

  removeMount() {
    this.stream.mounts.pop();
  }

}
