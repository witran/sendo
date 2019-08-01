const http = require('http');
const io = require('socket.io');
const express = require('express');
const ExpressPeerServer = require('peer').ExpressPeerServer;

class App {
	constructor(store, coordinator) {
		this.app = express();
		this.server = http.createServer(app);

		io.on('connection', this.handleClientConnect);
	}

	handleClientConnect(socket) {
		const node = coordinator.add(socket, nodeId);

		io.emit('message', { nodeId: node.id });

		// broadcast topology change to all nodes, nodes
		io.emit('message', { topology: coordinator.getTopology(), for: 'everyone' });

		// based on latest topology, if this is a leader, start streaming data to leader
		if (node.isLeader) {
			this.store.addConsumer(node);
		}

		socket.on('disconnect', function() {
			this.coordinator.remove(nodeId);

			if (node.isLeader) {
				this.store.removeConsumer(node);
			}
		});
	}

	handleClientDisconnect() {

	}

	start() {
		this.coordinator.start();
		this.server.listen(1234);
	}
}
