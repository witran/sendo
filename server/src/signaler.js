const http = require("http");
const express = require("express");
const ExpressPeerServer = require("peer").ExpressPeerServer;

class Signaler {
	constructor({ port }) {
		this.port = port;
	}

	start() {
		const app = express();
		const server = app.listen(this.port);
		const signaler = ExpressPeerServer(server, { debug: true });

		app.use("/peer", signaler);
		console.log("Peer Signaler listening at port", this.port);
	}
}

module.exports = Signaler;
