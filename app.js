const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
// Importing new installs
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const connectMongo = require('connect-mongo');
const session = require('express-session');
const MongoStore = connectMongo(session);

// Import our config file so we may use the data inside
const config = require('./server/config');

// Set up a Mongodb Connection as a Promise it will connect
const mongooseConnectionPromise = mongoose.connect(config.mongo.connection.uri, { useNewUrlParser: true });
// Check if mongoose connected, if it didn't check for an error, print to developer, and exit.
mongoose.connection.on('error', (err) => {
    console.error('MongoDB Connection Error: ' + err);
    process.exit(-1); // eslint-disable-line no-process-exit
});

/**
 * We create the app variable and initialize it to be an Express Application
 */
const app = express();

// init chunkservice, that watches for *.ts file changes and sync db
const chunkservice = require('./server/services/chunk-service');
chunkservice.ClearChunks();
chunkservice.WatchChunks(config.mediaPath);

// remove old (stream)users
const streamhostservice = require('./server/services/stream-host-service');
streamhostservice.clearUsers();
streamhostservice.clearAcks();

// body parser is quite detailed so read the following article to understand how it works.
// Understanding how Body Parser works : https://medium.com/@adamzerner/how-bodyparser-works-247897a93b90
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point to static path to dist
// __dirname is retrieved from javascript as the directory name of the location of this file.
// which should be ~/Angular-CLI-Fullstack
app.use(express.static(path.join(__dirname, 'dist')));

// We set the route of the templates and give it to expres
app.set('views', `${__dirname}/server/views`);
// Tell express's engine what file format we are targeting and what
// library to use, in this case we use EJS and it;d renderfile engine
app.engine('html', require('ejs').renderFile);
// And lastly we set the 'view engine' to be HTML
app.set('view engine', 'html');

// Tell Express that we are connecting to MongoDB as a session
app.use(session({
    // Secret hashes the session for security
    secret: config.secrets.session,
    saveUninitialized: true,
    resave: false,
    // Mongo Store instantiates the connection with the MongoDB database
    // And saves the session if connection is successfull.
    store: new MongoStore({
        url: config.mongo.connection.uri
    })
}));

/**
 * Here we make a variable Routes equal to the routes.js file located in the server folder.
 * In the routes.js file we will make a function that returns all routes for the entire application
 * We then call the function in the Routes variable, giving it the express app variable and __dirname
 */
const Routes = require('./server/routes'); // Import all route endpoints
Routes(app, __dirname);

// Get port from environment and store in Express
const port = process.env.PORT || '3000';
app.set('port', port);

// CREATE HTTP SERVER
const server = http.createServer(app);

// CREATE SOCKET.IO SERVER

const SocketIOServer = require('./server/socketio'); // Import all route endpoints
SocketIOServer(server);

// LISTEN ON PORT
server.listen(port, () => console.log(`API RUNNING ON LOCALHOST: ${port}`));