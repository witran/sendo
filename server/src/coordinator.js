const http = require('http');
const io = require('socket.io');
const express = require('express');
const ExpressPeerServer = require('peer').ExpressPeerServer;

module.exports = function startPeerHelper() {
	const app = express();

	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	const server = app.listen(4321);
	const peerserver = ExpressPeerServer(server, { debug: true });

	app.use('/api', peerserver);
}

function getRandomId(n) {
	var str = '', possible = BASE64_CHARS;

	while (n-- > 0)
		str += possible.charAt(Math.floor(Math.random() * possible.length));
	return str;
}

const MAX_CLUSTER_SIZE = 4;

class Coordinator {
	constructor() {
		this.topology = {};
		this.clusters = {};
	}

	addNode(socket) {
		// detect best fit cluster or create new cluster
		const id = getRandomId(16);
		for (let clusterId in clusters) {
			if cluster.size = 4;
		}
		return nodeId;
	}

	removeNode(nodeId) {
	}

	updateTopology() {

	}

	getTopology() {

	}
}
