'use strict';
const express = require('express');
// Import the Controller so we may assign specific functions to a route
const controller = require('./user.controller');

// Assign the route variable to an Express.Route handler
const router = express.Router();

router.post('/authAdmin', controller.authAdmin);
router.post('/authStream', controller.authStream);

// We export the routes to the express app, in the routes.js file we will assign the base URL for this endpoint.
// in this file we simply want to specify the path after the base /api/users url.
module.exports = router;