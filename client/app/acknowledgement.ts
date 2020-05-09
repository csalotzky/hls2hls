export class Acknowledgement {
    public source_uuid: string;
    public stream_id: string;
    public mount_path: string;
    public chunk_filename: string;
  
    constructor(source_uuid, stream_id, mount_path, chunk_filename) {
      this.source_uuid = source_uuid;
      this.stream_id = stream_id;
      this.mount_path = mount_path;
      this.chunk_filename = chunk_filename;
    }
  }
  