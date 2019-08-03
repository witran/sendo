const http = require('http');
const io = require('socket.io');
const express = require('express');
const getRandomId = require('./utils').getRandomId;

class App {
	constructor(store, coordinator) {
		this.store = store;
		this.coordinator = coordinator;
		this.app = express();
		this.server = http.createServer(app);

		io.on('connection', this.handleConnect);
	}

	handleConnect(socket) {
		const client = { socket, id: getRandomId(16) };

		socket.emit('SET_ID', { nodeId: peerId });
		this.coordinator.addNode(client);

		if (client.isLeader) {
			this.store.addConsumer(client);
			socket.emit('SET_LEADER', true);
		}

		socket.on('disconnect', this.handleDisconnect);
	}

	handleDisconnect(socket) {
		this.coordinator.remove(nodeId);

		if (node.isLeader) {
			this.store.removeConsumer(node);
		}

		socket.off('disconnect', this.handleDisconnect);
	}

	start() {
		this.coordinator.start();
		this.server.listen(1234);
	}
}

module.exports = App;
