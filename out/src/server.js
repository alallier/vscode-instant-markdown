"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const send = require("send");
class Server {
    constructor(options) {
        const app = require('express')();
        const http = require('http').Server(app);
        const io = require('socket.io')(http);
        const port = vscode.workspace.getConfiguration("instantmarkdown").get("port");
        const host = vscode.workspace.getConfiguration("instantmarkdown").get("host");
        app.get('/', function (req, res) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'no-store');
            res.sendFile(path.resolve(__dirname, '..', '..', 'index.html'));
        });
        app.get('/github-markdown.css', function (req, res) {
            res.sendFile(path.resolve(__dirname, '..', '..', 'node_modules', 'github-markdown-css', 'github-markdown.css'));
        });
        app.get('/github-highlight.css', function (req, res) {
            res.sendFile(path.resolve(__dirname, '..', '..', 'node_modules', 'highlight.js', 'styles', 'github.css'));
        });
        app.get('*', function (req, res) {
            send(req, URL.parse(req.url, `http://${host}`).pathname, { root: options.root }).pipe(res);
        });
        this.sockets = {};
        var nextSocketId = 0;
        http.on('connection', (socket) => {
            var socketId = nextSocketId++;
            this.sockets[socketId] = socket;
            socket.on('close', () => { delete this.sockets[socketId]; });
        });
        http.listen(port, host, function () {
            console.log('listening on *:' + port);
            options.started();
        });
        this.io = io;
        this.http = http;
    }
    send(markdown) {
        this.io.emit('markdown', markdown);
    }
    close() {
        this.io.close();
        for (var socketId in this.sockets) {
            console.log('socket', socketId, 'destroyed');
            this.sockets[socketId].destroy();
        }
        this.http.close(function () {
            ;
            console.log("stopped");
        });
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map