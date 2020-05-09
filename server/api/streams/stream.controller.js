'use strict';
const path = require('path');
const Stream = require('./stream.model');
const config = require('../../config');
const StreamHostHelper = require('../../services/stream-host-service.js');


/**
 * Handles validation errors and returns the error to the user.
 * @param {Express.Response} res - an Express Response object  
 * @param {number} statusCode - the result status code number 
 */
function validationError(res, statusCode) {
    statusCode = statusCode || 422;
    return function(err) {
        return res.status(statusCode).json(err);
    };
}

/**
 * handles error codes and sends the status code to the user.
 * @param {Express.Response} res - an Express Response object 
 * @param {number} statusCode -  the result status code number
 */
function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function(err) {
        return res.status(statusCode).send(err);
    };
}

/**
 * This function will search for all users in the users collection and show the
 * details, except for the salt and password
 * @param {Express.Request} req  - Express request object with possible parameters
 * @param {Express.Response} res - Express response object.
 */
function getAllStreams(req, res) {
    return Stream.find({}, '-_id -mounts._id -mounts.chunks')
        .exec()
        .then(streams => {
            res.status(200).json(streams);
        })
        .catch(handleError(res));
}


function createStream(req, res) {
    let newStream = new Stream(req.body);
    return newStream.save().then(function(stream) {
        res.json({ stream });
    }).catch(validationError(res)); // catch any errors

}

function getStream(req, res) {
    return Stream.find({
        id: req.params.id
    }, '-_id -mounts._id -mounts.chunks', (err, strm) => { // handle errors or user
        if (err) { // if user doesnt exist, error will be defined
            res.send(err); // return error to user
        }
        if (strm.length) {
            res.json(strm[0]);
        } else {
            res.send('Stream not found');
        }
    }).catch(err => next(err)); // any other errors not related to not finding the object, catch them
}

function deleteStream(req, res) {
    return Stream.findOneAndDelete({
        id: req.params.id
    }, (err, strm) => {
        if (err) {
            //res.send(err);
        }
        if (!strm) {
            //res.send('Stream not found.');
        }
        //res.send(`Stream ${req.params.id} deleted.`);
    }).catch(err => next(err));
}

function getStreamIndex(req, res) {
    return Stream.find({
        id: req.params.id,
        "mounts.path": req.params.mnt
    }, 'mounts.$', (err, strm) => {
        if (err) {
            res.send(err);
        }
        if (strm.length) {
            var chunks = [];
            strm[0].mounts[0].chunks.forEach(function(file) {
                chunks.push(file.filename);
            });
            res.json(chunks);
        } else {
            res.send('Stream or mount not found');
        }
    }).catch(err => next(err));
}

function getStreamM3U(req, res) {
    return Stream.find({
        id: req.params.id,
        "mounts.path": req.params.mnt
    }, (err, strm) => {
        if (err) {
            res.send(err);
        }
        if (strm.length) {
            res.download(path.join(config.mediaPath, strm[0].id, strm[0].mounts[0].path, strm[0].mounts[0].fileschema + '.m3u8'));
        } else {
            res.send('Stream or mount not found');
        }
    })
}

function getStreamSegment(req, res) {
    // SERACH STREAM + MOUNT
    getStreamSegmentCallback(req, function(err, chunk) {
        if (err) {
            // Stream or mount not found
            res.status(404).send('Stream or mount not found');
        } else {
            // CHECK IF MOUNT IS LEGACY -> DOWNLOAD CHUNK
            if (chunk[3]) {
                res.download(path.join(config.mediaPath, chunk[0], chunk[1], chunk[2]));
            } else {
                // CHECK IF TOKEN IS VALID
                if (req.headers.authorization !== 'undefined') {
                    StreamHostHelper.getUserFromToken(req.headers.authorization.replace('Bearer ', '')).exec(function(err, user) {
                        if (err) {
                            // Unknown error
                            res.status(403).json('Error while checking token');
                        } else if (user !== null) {
                            // VALID TOKEN -> CHECK WHETHER USER HAS ALREADY DOWNLOADED THE CHUNK
                            StreamHostHelper.userHasChunk(user.uuid, chunk[0], chunk[1], chunk[2]).exec(
                                function(err, sameuser) {
                                    if (err) {
                                        // Unknown error
                                        res.status(403).json('Error while checking token');
                                    } else {
                                        if (!user.length) {
                                            // USER WITH THE SAME CHUNK WAS NOT FOUND -> VALID REQUEST, CHECK WHETHER THE SERVER HAS FREE UPLOAD SLOT
                                            StreamHostHelper.isUploadSlotAvailableCallback(chunk, function(err, available) {
                                                if (err) {
                                                    // Unknown error
                                                    res.status(403).json('Unknown error');
                                                } else if (available) {
                                                    // UPLOAD SLOT AVAILABLE -> DOWNLOAD CHUNK
                                                    res.download(path.join(config.mediaPath, chunk[0], chunk[1], chunk[2]));
                                                } else {
                                                    res.status(403).json('No free upload resource available. Download chunk via P2P!');
                                                }
                                            });
                                        } else {
                                            res.status(403).json('Chunk has already been downloaded');
                                        }
                                    }
                                }
                            )
                        } else {
                            res.status(403).json('Invalid token');
                        }
                    });
                } else {
                    res.status(403).json('Missing token');
                }
            }
        }
    });
}


function getStreamSegmentCallback(req, callback) {
    return Stream.find({
        id: req.params.id,
        "mounts.path": req.params.mnt
    }, (err, strm) => {
        if (err) {
            callback(err, null);
        }
        if (strm.length) {
            var mnt = strm[0].mounts.find(m => m.path === req.params.mnt);
            if (mnt !== 'undefined') {
                callback(null, [strm[0].id, mnt.path, req.params.file, mnt.legacy]);
            } else {
                callback(err, null);
            }
        } else {
            callback(err, null);
        }
    })
}


function whoHasChunk(req, res) {
    StreamHostHelper.whoHasChunk(req.params.id, req.params.mnt, req.params.file).exec(
        function(err, users) {
            if (err) res.send(err);
            else if (users !== null && users.length) {
                res.json(users);
            } else {
                res.send('No peer found');
            }
        });
}

// Any functions we create, we want to return these functions to the express app to use.
module.exports = { getAllStreams, createStream, getStream, deleteStream, getStreamIndex, getStreamM3U, getStreamSegment, whoHasChunk };