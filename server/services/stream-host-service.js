const User = require('../api/users/user.model');
const Acknowledgement = require('../api/acknowledgements/acknowledgement.model');
const config = require('../config');

// Search user by token
function getUserFromToken(token) {
    return User.findOne({ 'token': token });
}

// Search users who already have given chunk
function whoHasChunk(streamid, mountpath, filename) {
    return Acknowledgement.aggregate([
        { $match: { 'stream_id': streamid, 'mount_path': mountpath, 'chunk_filename': filename } },
        { $sample: { size: 20 } },
        {
            $group: {
                _id: "$_id",
                document: { $push: "$$ROOT" }
            }
        },
        {
            $unwind: "$document"
        },
        {
            $project: {
                _id: 0,
                "uuid": "$document.uuid"
            }
        },
    ])
}

// Check if given user has already downloaded a chunk
function userHasChunk(uuid, streamid, mountpath, filename) {
    return Acknowledgement.findOne({ 'uuid': uuid, 'stream_id': streamid, 'mount_path': mountpath, 'chunk_filename': filename }, '-_id -source_uuid -stream_id -mount_path -chunk_filename -__v');
}

// Clear User table
function clearUsers() {
    User.collection.drop();
}

// Clear Acknowledgement table
function clearAcks() {
    Acknowledgement.collection.drop();
}

// Clear all entries that belong to a given chunk
function clearAcksByChunk(streamid, mountpath, chunk) {
    Acknowledgement.deleteMany({ 'stream_id': streamid, 'mount_path': mountpath, 'chunk_filename': chunk }).exec();
}

// Clear all entries that belong to a given user
function clearAcksByUser(uuid) {
    Acknowledgement.deleteMany({ 'uuid': uuid }).exec();
}

// Gets maximum upload slots for given mount 
// TODO
function maxUploadSlots() {
    return config.maxUploadSlotsPerMount;
}

// Checks if free upload slot available for given chunk
function isUploadSlotAvailableCallback(req, callback) {
    return Acknowledgement.find({ 'source_uuid': 'SERVER', 'stream_id': req[0], 'mount_path': req[1], 'chunk_filename': req[2] }, (err, result) => {
        if (err) {
            callback(err, null);
        }
        callback(null, !result.length || maxUploadSlots() - result.length > 0);
    })
}

module.exports = { getUserFromToken, whoHasChunk, userHasChunk, clearUsers, clearAcks, clearAcksByChunk, clearAcksByUser, maxUploadSlots, isUploadSlotAvailableCallback };