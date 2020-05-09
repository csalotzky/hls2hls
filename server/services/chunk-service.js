const Stream = require('../api/streams/stream.model');
const StreamHostHelper = require('./stream-host-service');

var WatchChunks = function(path) {
    async function addChunk(path) {
        var params = path.split(/[\\\/]/);
        var fname = params[params.length - 1];
        var mnt = params[params.length - 2];
        var strm = params[params.length - 3];

        Stream.findOneAndUpdate({ id: strm, "mounts.path": mnt }, {
            $push: { "mounts.$.chunks": { "filename": fname, "count": 0 } }
        }, function(err, res) {
            if (err) {
                console.log(err);
                res.send(err);
                return;
            }
            if (!res) {
                console.log("CHUNK ADD | No matching stream found for: " + path);
            } else {
                console.log("CHUNK ADD | Successfully added: " + path);
            }
        });
    }

    async function deleteChunk(path) {
        var params = path.split(/[\\\/]/);
        var fname = params[params.length - 1];
        var mnt = params[params.length - 2];
        var strm = params[params.length - 3];

        StreamHostHelper.clearAcksByChunk(strm, mnt, fname);
        Stream.findOneAndUpdate({ id: strm, "mounts.path": mnt }, {
            $pull: { "mounts.$.chunks": { filename: fname } }
        }, function(err, res) {
            if (err) {
                console.log(err);
                res.send(err);
                return;
            }
            if (!res) {
                console.log("CHUNK DELETE | No matching stream found for: " + path);
            } else {
                console.log("CHUNK DELETE | Successfully deleted: " + path);
            }
        });
    }

    require('chokidar').watch(`${path}/**/*.ts`, { ignored: /[\/\\]\./ })
        .on('add', function(path) {
            addChunk(path);
        })
        .on('unlink', function(path) {
            deleteChunk(path);
        })
        .on('error', function(error) {
            console.log('Error happened', error);
        });
};

var ClearChunks = function() {
    Stream.updateMany({}, {
        $set: { "mounts.$[].chunks": [] }
    }, function(err, res) {
        if (err) {
            console.log(err);
            return;
        }
        if (!res) {
            console.log(res);
        } else {
            console.log("CHUNK CLEAR | All chunk cleared");
        }
    });

};

module.exports = {
    WatchChunks: WatchChunks,
    ClearChunks: ClearChunks
}