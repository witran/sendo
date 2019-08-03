const http = require('http');
const io = require('socket.io');
const express = require('express');
const ExpressPeerServer = require('peer').ExpressPeerServer;

class PeerServer {
	constructor({ port }) {
		this.port = port;
	}

	start() {
		const app = express();
		const server = app.listen(this.port);
		const peerserver = ExpressPeerServer(server, { debug: true });

		app.use('/api', peerserver);
	}
}

module.exports = PeerServer;
