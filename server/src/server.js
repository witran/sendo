const http = require("http");
const EventEmitter = require("events");
const io = require("socket.io");
const express = require("express");
const cors = require("cors");
const getRandomId = require("./utils").getRandomId;
const { Messages, LogTypes } = require("./constants");

class Server extends EventEmitter {
	constructor(store, coordinator, sender, config) {
		super();
		this.store = store;
		this.coordinator = coordinator;
		this.sender = sender;
		this.config = config;

		const app = express();

		app.use(cors());
		this.server = http.createServer(app);
		this.io = io(this.server);
		this.io.origins(["localhost:3000"]);
		this.io.on("connection", this.handleConnection.bind(this));
		this.store.on("change", this.sender.broadcast.bind(this.sender));
	}

	handleConnection(socket) {
		socket.on("event", (event) => {
			if (event.type === Messages.Incoming.SetId) {
				console.log("HANDLE FIRST EVENT", event.id);
				this.initClient(new Client(event.id, socket));
			}
		});
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
		this.sender.addClient(client);

		client.socket.on("event", event => {
			this.handleClientEvent(client, event);
			this.emit("log", {
				type: LogTypes.Server.ClientEvent,
				client: client.id,
				event
			});
		});

		client.socket.on("disconnect", event => {
			this.handleClientDisconnect(client);
			this.emit("log", {
				type: LogTypes.Server.ClientDisconnect,
				client: client.id,
				event
			});
		});

		this.emit("log", {
			type: LogTypes.Server.ClientInit,
			client: client.id
		});
	}

	handleClientEvent(client, event) {
		switch (event.type) {
			case Messages.Incoming.Ack:
				this.sender.handleAck(client, event.offsets, event.from);
				break;
			default:
				console.log("UNEXPECTED EVENT:", event);
		}
	}

	handleClientDisconnect(client) {
		this.coordinator.removeClient(client);
		this.sender.removeClient(client);
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
