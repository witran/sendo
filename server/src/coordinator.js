const EventEmitter = require("events");
const { getRandomId } = require("./utils");
const { Messages, LogTypes } = require("./constants");
const CLUSTER_MAX_SIZE = 8;

class Coordinator extends EventEmitter {
	constructor(config) {
		super();
		this.config = config;
		this.clients = {};
		this.clusters = {};
		this.clientClusterMap = {};
	}

	updateConfig(config) {
		this.config = config;
		this.updateTopology();
	}

	updateTopology() {}

	// update topology and send join instructions
	addClient(client) {
		this.clients[client.id] = client;
		const cluster = this.getOrCreateCluster(client);
		this.joinCluster(client, cluster);
		this.emit("log", {
			type: LogTypes.Coordinator.AddClient,
			client: client.id,
			cluster: cluster.id
		});
	}

	// update topology and send close instruction
	removeClient(client) {
		const cluster = this.clientClusterMap[client.id];
		this.leaveCluster(client, cluster);
		this.removeClusterIfEmpty(cluster);
		delete this.clients[client.id];
		this.emit("log", {
			type: LogTypes.Coordinator.RemoveClient,
			client: client.id,
			cluster: cluster.id
		});
	}

	getOrCreateCluster(client) {
		let cluster = Object.values(this.clusters).filter(
			cluster => cluster.members.length < this.config.clusterSize
		)[0];

		if (!cluster) {
			cluster = {
				id: getRandomId(),
				members: []
			};
			this.clusters[cluster.id] = cluster;
		}

		this.clientClusterMap[client.id] = cluster;
		return cluster;
	}

	joinCluster(client, cluster) {
		cluster.members.forEach(function(member) {
			member.socket.emit("event", {
				type: Messages.Outgoing.AddEdge,
				neighborId: client.id,
				isInitiator: true
			});
			client.socket.emit("event", {
				type: Messages.Outgoing.AddEdge,
				neighborId: member.id
			});
		});

		cluster.members.push(client);
	}

	leaveCluster(client, cluster) {
		delete this.clientClusterMap[client.id];

		cluster.members.splice(cluster.members.indexOf(client), 1);

		cluster.members.forEach(function(member) {
			member.socket.emit("event", {
				type: Messages.Outgoing.RemoveEdge,
				neighborId: client.id,
				isInitiator: true
			});
			client.socket.emit("event", {
				type: Messages.Outgoing.RemoveEdge,
				neighborId: member.id
			});
		});
	}

	removeClusterIfEmpty(cluster) {
		if (!cluster.members.length) {
			delete this.clusters[cluster.id];
		}
	}
}

function getBestFitCluster(client, clusters) {
	return null;
}

module.exports = Coordinator;
