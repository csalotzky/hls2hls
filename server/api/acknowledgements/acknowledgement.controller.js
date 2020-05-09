'use strict';
const Acknowledgement = require('./acknowledgement.model');
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

function makeAcknowledgement(req, res) {
    StreamHostHelper.getUserFromToken(req.headers.authorization.replace('Bearer ', '')).exec(
        function(err, user) {
            if (err) console.log("getUserFromToken error");
            else if (user !== null) {
                let newAck = new Acknowledgement(req.body);
                newAck.uuid = user.uuid;
                return newAck.save().then(function(ack) {
                    console.log("ACK REGISTERED | Source: " + ack.source_uuid + " destination: " + ack.uuid);
                }).catch(validationError(res)); // catch any errors
            }
        });
    res.send();
}

// Any functions we create, we want to return these functions to the express app to use.
module.exports = { makeAcknowledgement };