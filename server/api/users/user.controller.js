'use strict';
const User = require('./user.model');
const Acknowledgement = require('../acknowledgements/acknowledgement.model');
const { uuid } = require('uuidv4');
const jwt = require('jsonwebtoken');

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

function authAdmin(req, res) {
    if (!(req.body.username == 'admin' && req.body.password == 'hls2HLS_7357_password')) return res.sendStatus(401);
    var token = jwt.sign({ userID: 'admin' }, 'hls2hls-testapp-secret', { expiresIn: '2h' });
    console.log("TOKEN | Generate admin token: " + token + " for: " + req.connection.remoteAddress);
    res.send({ token });
};

function authStream(req, res) {
    if (req.body.socketid) {
        var socketid = req.body.socketid

        var newToken = jwt.sign({ socketid }, 'hls2hls-testapp-secret', { expiresIn: '2h' });
        let newUser = {
            uuid: socketid,
            token: newToken,
            ip: req.connection.remoteAddress,
            uploadBandwidth: 0,
        };
        return new User(newUser).save().then(function(user) {
            console.log("TOKEN | Generate stream token: " + user.token + " for: " + user.ip);
            res.json({ user });
        }).catch(validationError(res)); // catch any errors
    } else {
        res.status(403).send('Invalid request');
    }
}

// Any functions we create, we want to return these functions to the express app to use.
module.exports = { authAdmin, authStream };