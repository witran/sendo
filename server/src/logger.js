const express = require("express");
const http = require("http");

class Logger {
	constructor(tracedServer, config) {
		const app = express();
		this.tracedServer = tracedServer;
		this.config = config;
		this.server = http.createServer(app);
		this.io = io(this.server);
		this.io.origins(["localhost:3000"]);
		this.io.on("connection", this.handleConnection.bind(this));
	}

	handleClientConnect(socket) {
		socket.emit("state", this.snapshot());

		const send = function(e) {
			socket.emit("log", e);
		};

		this.coordinator.on("log", send);
		this.distributor.on("log", send);
		this.server.on("log", send);

		socket.on("disconnect", function() {
			this.coordinator.off("log", send);
			this.distributor.off("log", send);
			this.server.off("log", send);
		});
	}

	snapshot() {
		const { clusters, clients, distributor, store } = this.tracedServer;

		const clients = Object.values(clients).map(client => client.id);
		const store = { snapshot: store.snapshot };
		const distributor = {
			bufferMap: distributor.bufferMap.values(buffer => buffer.toArray()),
			seedRatio: distributor.seedRatio
		};
		const clusters = Object.values(this.clusters).map(cluster => {
			return {
				id: cluster.id,
				members: cluster.members.map(member => member.id)
			};
		});

		return { clusters, clients, distributor, store };
	}

	start() {
		this.server.start(this.config.port);
	}
}
