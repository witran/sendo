const http = require("http");
const io = require("socket.io")(http);
const express = require("express");
const cors = require("cors");
const getRandomId = require("./utils").getRandomId;
const Mesasges = require("./constants").Messages;

class Server {
	constructor(store, coordinator, distributor, config) {
		this.config = config;
		this.store = store;
		this.coordinator = coordinator;
		this.distributor = distributor;
		this.clients = {};
		const app = express();
		this.server = http.createServer(app);
		this.io = io(this.server);
		app.use(cors);
		io.set("origins", "*:*");

		this.io.on("connection", this.handleConnection);
		store.on("change", this.distributor.broadcast.bind(this.distributor));
	}

	handleConnection(socket) {
		const id = getRandomId();
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
		console.log("Server listening at port", this.config.port);
	}
}

class Client {
	constructor(id, socket) {
		this.id = id;
		this.socket = socket;
	}
}

module.exports = Server;
