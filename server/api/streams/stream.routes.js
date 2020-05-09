'use strict';
const express = require('express');
// Import the Controller so we may assign specific functions to a route
const controller = require('./stream.controller');

// Assign the route variable to an Express.Route handler
const router = express.Router();

/**
 * path: /api/streams
 * method: GET
 * function: listAllStreams() in the stream.controller.js file
 */
router.get('/', controller.getAllStreams);

/**
 * path: /api/streams
 * method: POST
 * function: create() in the stream.controller.js file
 */
router.post('/', controller.createStream);

/**
 * path: /api/streams/:id
 * method: GET
 * function: getStream() in the stream.controller.js file
 */
router.get('/:id', controller.getStream);

router.delete('/:id', controller.deleteStream);

router.get('/:id/:mnt', controller.getStreamIndex);

router.get('/:id/:mnt/m3u', controller.getStreamM3U);

router.get('/:id/:mnt/:file', controller.getStreamSegment);

router.get('/:id/:mnt/:file/peer', controller.whoHasChunk);

// We export the routes to the express app, in the routes.js file we will assign the base URL for this endpoint.
// in this file we simply want to specify the path after the base /api/users url.
module.exports = router;