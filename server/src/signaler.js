const http = require('http');
const io = require('socket.io');
const express = require('express');
const ExpressPeerServer = require('peer').ExpressPeerServer;

class Signaler {
	constructor({ port }) {
		this.port = port;
	}

	start() {
		const app = express();
		const server = app.listen(this.port);
		const signaler = ExpressPeerServer(server, { debug: true });

		app.use('/peer', signaler);
	}
}

module.exports = Signaler;
