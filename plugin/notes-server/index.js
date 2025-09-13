var express   = require('express');
var fs        = require('fs');
var http      = require('http');
var path      = require('path');
var io        = require('socket.io');
var _         = require('underscore');
var Mustache  = require('mustache');

var app       = express();
var server    = http.createServer(app);
var staticDir = express.static;

// Initialize socket.io with the http server
io            = io(server);

var port = process.env.PORT || 3000;

var opts = {
    port:     port,
    baseDir:  path.join(__dirname, '../../')
};

// Set up socket.io connection
io.on('connection', function(socket) {
    socket.on('slidechanged', function(slideData) {
        socket.broadcast.emit('slidedata', slideData);
    });
    socket.on('fragmentchanged', function(fragmentData) {
        socket.broadcast.emit('fragmentdata', fragmentData);
    });
});

// Set up static file serving
[ 'css', 'js', 'images', 'plugin', 'lib' ].forEach(function(dir) {
    app.use('/' + dir, staticDir(path.join(opts.baseDir, dir)));
});

// Serve the main presentation
app.get("/", function(req, res) {
    fs.createReadStream(path.join(opts.baseDir, 'index.html')).pipe(res);
});

// Serve the notes page
app.get("/notes/:socketId", function(req, res) {
    fs.readFile(path.join(opts.baseDir, 'plugin/notes-server/notes.html'), function(err, data) {
        if (err) {
            console.error('Error reading notes.html:', err);
            return res.status(500).send('Error loading notes');
        }
        res.send(Mustache.to_html(data.toString(), {
            socketId: req.params.socketId
        }));
    });
});

// Error handling middleware
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
server.listen(opts.port || 3000, function() {
    var brown = '\x1b[33m',
        green = '\x1b[32m',
        reset = '\x1b[0m';

    var port = server.address().port;
    var slidesLocation = "http://localhost:" + port;

    console.log(brown + 'reveal.js - Speaker Notes' + reset);
    console.log('1. Open the slides at ' + green + slidesLocation + reset);
    console.log('2. Click on the link in your JS console to go to the notes page');
    console.log('3. Advance through your slides and your notes will advance automatically');
});
