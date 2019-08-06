const http = require("http");
const io = require("socket.io");
const express = require("express");
const getRandomId = require("./utils").getRandomId;
const Mesasges = require("./constanst").Messages;

class Server {
	constructor(store, coordinator, distributor, config) {
		this.config = config;
		this.store = store;
		this.coordinator = coordinator;
		this.app = express();
		this.server = http.createServer(app);
		this.clients = {};

		io.on("connection", this.handleConnection);
		store.on("message", distributor.send);
	}

	handleConnection(socket) {
		const id = getRandomId(16);
		const client = new Client(id, socket);

		socket.emit("event", {
			type: Messages.Outgoing.SetId,
			id
		});
		// dump state, to be improved with offset replay
		socket.emit("event", {
			type: Messages.Outgoing.Data,
			data: {
				snapshot: store.getSnapshot()
			}
		});

		this.coordinator.addClient(client);
		this.distributor.addClient(client);

		socket.on("event", event => {
			this.handleClientEvent(client, event);
		});

		socket.on("disconnect", event => {
			this.handleClientDisconnect(client);
		});
	}

	handleClientEvent(client, event) {
		switch (event.type) {
			case Messages.Incoming.PeerConnected:
				this.coordinator.handlePeerConnected();
				break;
			case Messages.Incoming.PeerClosed:
				this.coordinator.handlePeerClosed();
				break;
			case Messages.Incoming.Ack:
				this.distributor.handleAck(client.id, event.offset);
				break;
			default:
				console.log("UNEXPECTED EVENT:", event);
		}
	}

	handleClientDisconnect(client) {
		this.coordinator.removeClient(client.id);
		this.distributor.removeClient(client.id);
	}

	start() {
		this.server.listen(this.config.port);
	}
}

class Client {
	constructor(id, socket) {
		this.id = id;
		this.socket = socket;
		this.isReadyForGossip = false;
	}
}

module.exports = App;
