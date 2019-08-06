const http = require('http');
const io = require('socket.io');
const express = require('express');
const getRandomId = require('./utils').getRandomId;

class Server {
	constructor(store, coordinator, config) {
		this.config = config;
		this.store = store;
		this.coordinator = coordinator;
		this.app = express();
		this.server = http.createServer(app);
		this.clients = {};

		io.on('connection', this.handleConnection);
		store.on('message', distributor.send);
	}

	handleConnection(socket) {
		const id = getRandomId(16);
		const client = new Client(id, socket);
		// client.init();
		this.clients[id] = client;
	}

	handleClientEvent() {

	}

	start() {
		this.server.listen(config.port);
	}
}


class Client {
	constructor(id, socket) {
		this.id = id;
		this.socket = socket;
	}

	// init() {
		// this.socket.on('disconnect', this.handleDisconnect);
		// this.socket.on('event', this.handleEvent);
		// this.socket.emit('event', { type: Messages.Outgoing.SetId, id: client.id });
		// this.coordinator.addNode(client);
	// }

	// handleEvent(event) {
	// 	switch (event.type) {
	// 		case Messages.Incoming.SetOffset:
	// 			break;
	// 		case Messages.Incoming.PeerClosed:
	// 			// reselect leader
	// 			break;
	// 		case Messages.Incoming.PeerConnected:
	// 			// do nothing
	// 			break;
	// 		default:
	// 			console.log('UNEXPECTED EVENT:', event);
	// 	}
	// }

	// handleDisconnect() {
	// 	this.coordinator.removeNode(this.id);

	// 	if (this.isLeader) {
	// 		this.store.removeConsumer(node);
	// 	}

	// 	this.socket.off('disconnect', this.handleDisconnect);
	}
}

module.exports =

module.exports = App;
