//const webpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const http = require('http');

const utils = require('./utils');

// set up server
var app = express();
app.use(favicon(path.join(__dirname, 'imgs', 'favicon.ico')));
app.use(express.static(__dirname + './public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const prodConfig = require('./webpack.prod.js');
const devConfig = require('./webpack.dev.js');
const options = {};
var PORT = 5000;

var mode = 'prod';
if (process.argv.length < 3) mode = 'prod';
if (process.argv[2] != 'prod' & process.argv[2] != 'dev') {
    console.error('Wrong mode - only dev or prod is accepted!');
    return;
};
mode = process.argv[2];
if (mode == 'prod') {
    compiler = webpack(prodConfig);
    PORT = 80;
}
else compiler = webpack(devConfig);

const server = new http.Server(app);
const io = require('socket.io')(server);

server.listen(PORT, () => {
    console.log(`listening to port ${PORT}`)
});
app.use(
    middleware(compiler, options)
);
app.use(require('webpack-hot-middleware')(compiler));

// setup backend data for servicese

// websocket communication handlers
io.on('connection', function(socket){
    count ++;
    console.log(`${count}th user connected with id: ${socket.id}`);
    socket.on('disconnect', function(){
        count --;
        console.log(`1 user disconnected, rest ${count}`);
    });
    
});

// normal routes with POST/GET 
app.get('*', (req, res, next) => {
    var filename = path.join(compiler.outputPath,'index');
    
    compiler.outputFileSystem.readFile(filename, async (err, data) => {
        if (err) {
            return next(err);
        }
        res.set('content-type','text/html');
        res.send(data);
        res.end();
    });
});


// on terminating the process
process.on('SIGINT', _ => {
    console.log('now you quit!');

    for (const id in posts) {
        let name = posts[id].fn;
        delete posts[id].fn;
        delete posts[id].article;
        fs.writeFileSync(path.join(postsPath, 'postinfo', name + '.json'), JSON.stringify(posts[id], undefined, 4));
        console.log(path.join(postsPath, 'postinfo', name + '.json'));
    }
    process.exit();
})