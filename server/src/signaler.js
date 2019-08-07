const http = require("http");
const express = require("express");
const ExpressPeerServer = require("peer").ExpressPeerServer;

class Signaler {
	constructor(config) {
		this.config = config;
	}

	start() {
		const app = express();
		const server = app.listen(this.config.port);
		const signaler = ExpressPeerServer(server, { debug: true });

		app.use("/peer", signaler);
		console.log("Peer Signaler listening at port", this.config.porg);
	}
}

module.exports = Signaler;
