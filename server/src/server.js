const http = require("http");
const io = require("socket.io");
const express = require("express");
const cors = require("cors");
const getRandomId = require("./utils").getRandomId;
const Messages = require("./constants").Messages;

class Server {
	constructor(signaler, store, coordinator, distributor, config) {
		this.config = config;
		this.signaler = signaler;
		this.store = store;
		this.coordinator = coordinator;
		this.distributor = distributor;
		const app = express();
		app.use(cors());
		this.server = http.createServer(app);
		this.io = io(this.server);
		this.io.origins(["localhost:3000"]);
		this.io.on("connection", this.handleConnection.bind(this));
		this.store.on("change", this.distributor.broadcast.bind(this.distributor));
	}

	handleConnection(socket) {
		socket.on("event", (event) => {
			if (event.type === Messages.Incoming.SetId) {
				console.log("HANDLE FIRST EVENT", event.id);
				this.initClient(new Client(event.id, socket));
			}
		});
		// socket.emit("event", {
		// 	type: Messages.Outgoing.SetId,
		// 	id
		// });
	}

	// init only after receive id from client
	initClient(client) {
		// dump state, to be improved with offset replay
		client.socket.emit("event", {
			type: Messages.Outgoing.Data,
			data: {
				snapshot: this.store.getSnapshot()
			}
		});

		this.coordinator.addClient(client);
		this.distributor.addClient(client);

		client.socket.on("event", event => {
			this.handleClientEvent(client, event);
		});

		client.socket.on("disconnect", event => {
			this.handleClientDisconnect(client);
		});
	}

	handleClientEvent(client, event) {
		switch (event.type) {
			case Messages.Incoming.Ack:
				this.distributor.handleAck(client, event.offsets);
				break;
			default:
				console.log("UNEXPECTED EVENT:", event);
		}
	}

	handleClientDisconnect(client) {
		this.coordinator.removeClient(client);
		this.distributor.removeClient(client);
	}

	start() {
		this.server.listen(this.config.port);
		this.signaler.start();
		console.log("Server listening at port", this.config.port);
	}
}

class Client {
	constructor(id, socket) {
		this.id = id;
		this.socket = socket;

		// socketConnected = false;
	}
}

module.exports = Server;
