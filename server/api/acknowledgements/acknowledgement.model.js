const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema; // Mongoose model is a Schema

// User Model Definition below
const AcknowledgementSchema = new Schema({
    uuid: String,
    source_uuid: String,
    stream_id: String,
    mount_path: String,
    chunk_filename: String,
});

/**
 * Export mongoose.model() which can take up to 3 parameters
 * @param {string} ModelName - The name of the model in thise case 'User'
 * @param {mongoose.Schema} AcknowledgementSchema - The Schema variable we created
 * @param {string} CollectionName - name of the collection User model saves to. 
 */
module.exports = mongoose.model('Acknowledgement', AcknowledgementSchema, 'acknowledgements');