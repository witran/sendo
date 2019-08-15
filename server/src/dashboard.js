const http = require("http");
const express = require("express");
const io = require("socket.io");
const { fromEntries } = require("./utils");
const { DashboardMessages } = require("./constants");

class Dashboard {
	constructor(tracedServer, config) {
		const app = express();
		this.tracedServer = tracedServer;
		this.config = config;
		this.server = http.createServer(app);
		this.io = io(this.server);
		this.io.origins(["localhost:3333"]);
		this.io.on("connection", this.handleConnection.bind(this));
	}

	handleConnection(socket) {
		console.log("DAHSBOARD CLIENT CONNECT");
		socket.emit("event", {
			type: DashboardMessages.Outgoing.Snapshot,
			snapshot: this.snapshot()
		});

		const send = function(e) {
			socket.emit("event", {
				type: DashboardMessages.Outgoing.Log,
				log: e
			});
		};

		const { sender, coordinator } = this.tracedServer;

		this.tracedServer.on("log", send);
		coordinator.on("log", send);
		sender.on("log", send);

		socket.on("disconnect", () => {
			this.tracedServer.removeListener("log", send);
			coordinator.removeListener("log", send);
			sender.removeListener("log", send);
		});
	}

	snapshot() {
		const { coordinator, sender, store } = this.tracedServer;

		const sClients = Object.values(coordinator.clients).map(
			client => client.id
		);

		const sStore = { snapshot: store.snapshot };
		const sSender = {
			bufferMap: fromEntries(
				Object.entries(sender.bufferMap).map(([key, value]) => [
					key,
					value.toArray()
				])
			),
			seedRatio: sender.seedRatio
		};
		const sCoordinator = {
			clusters: fromEntries(
				Object.entries(coordinator.clusters).map(([key, value]) => [
					key,
					{ members: value.members.map(member => member.id) }
				])
			),
			clusterSize: coordinator.clusterSize
		};

		return {
			coordinator: sCoordinator,
			clients: sClients,
			sender: sSender,
			store: sStore
		};
	}

	start() {
		this.server.listen(this.config.port);
		console.log("Dashboard listening at port", this.config.port);
	}
}

module.exports = Dashboard;
