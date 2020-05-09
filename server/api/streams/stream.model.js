const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Schema = mongoose.Schema; // Mongoose model is a Schema

// User Model Definition below
const StreamSchema = new Schema({
    id: {
        type: String,
        required: [true, 'can\'t be blank'],
        match: [/^[a-z0-9_\-]+$/, 'is invalid'],
        index: true
    },
    name: String,
    description: String,
    mounts: [{
        path: {
            type: String,
            required: [true, 'can\'t be blank'],
            match: [/^[a-z0-9_\-]+$/, 'is invalid'],
        },
        fileschema: {
            type: String,
            required: [true, 'can\'t be blank'],
            match: [/^[a-z0-9_\-]+$/, 'is invalid'],
        },
        legacy: Boolean,
        resolution: {
            type: String,
            match: [/\d+x+\d+/, 'is invalid'],
        },
        bitrate: Number,
        chunks: [{
            filename: String,
            count: Number
        }]
    }]
});

const ChunkSchema = new Schema({
    id: {
        type: String,
        required: [true, 'can\'t be blank'],
        match: [/^[a-z0-9_\-]+$/, 'is invalid'],
        index: true
    },
    path: {
        type: String,
        required: [true, 'can\'t be blank'],
        match: [/^[a-z0-9_\-]+$/, 'is invalid'],
    },
    filename: String,
    count: Number
});

/**
 * Export mongoose.model() which can take up to 3 parameters
 * @param {string} ModelName - The name of the model in thise case 'User'
 * @param {mongoose.Schema} UserSchema - The Schema variable we created
 * @param {string} CollectionName - name of the collection User model saves to. 
 */
module.exports = mongoose.model('Stream', StreamSchema, 'streams');