const path = require('path');
const _ = require('lodash');

/**
 * Configuration settings for DB and application
 */
const all = {
    // secrets used to encrypt session data
    secrets: {
        // this secret is used to encrypt express session logs as well as user password
        session: 'hls2hls-testapp-secret'
    },
    // Mongo Db settings
    mongo: {
        // Connection data
        connection: {
            useMongoClient: true,
            uri: 'mongodb://localhost:27017/h2hdb'
        },
        // Mongo DB Options
        options: {
            db: {
                safe: true
            }
        }
    },
    mediaPath: path.join(__dirname, '../../media'),
    maxUploadSlotsPerMount: 1
};

// Export all settings
module.exports = _.merge(
    all
);