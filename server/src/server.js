const http = require('http');
const io = require('socket.io');
const express = require('express');
const getRandomId = require('./utils').getRandomId;
const Mesasges = require('./constanst').Messages;

class Server {
	constructor(store, coordinator, distributor, config) {
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
		const client = { id, socket };
		this.clients[id] = client;

		socket.on('event', (event) => {
			this.handleClientEvent(client, event);
		})

		socket.on('disconnect', (event) => {
			this.handleClientDisconnect(client);
		});

		socket.emit('event', { type: Messages.Outgoing.SetId, id: client.id });
	}

	handleClientEvent(client, event) {
		switch (event) {
			switch (event.type) {
				case Messages.Incoming.StartStream:
					// send snapshot or replay from queue
					break;
				case Messages.Incoming.PeerClosed:
					break;
				case Messages.Incoming.PeerConnected:
					break;
				case Messages.Incoming.Ack:
					this.distributor.handleAck(client.id, event.offset);
					break;
				default:
					console.log('UNEXPECTED EVENT:', event);
			}
		}
	}

	handleClientDisconnect(client) {
		this.coordinator.removeClient(client.id);
		this.distributor.removeClient(client.id);
		delete this.clients[client.id];
	}

	start() {
		this.server.listen(this.config.port);
	}
}


class Client {
	constructor(id, socket) {
		this.id = id;
		this.socket = socket;
	}
}

module.exports = App;
