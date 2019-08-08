const getRandomId = require("./utils").getRandomId;
const Messages = require("./constants").Messages;
const CLUSTER_MAX_SIZE = 8;

class Coordinator {
	constructor() {
		this.clients = {};
		this.clusters = {};
		this.clientClusterMap = {};
	}

	// update topology and send join instructions
	addClient(client) {
		this.clients[client.id] = client;
		const cluster = this.getOrCreateCluster(client);
		this.joinCluster(client, cluster);
	}

	// update topology and send close instruction
	removeClient(client) {
		const cluster = this.clientClusterMap[client.id];
		this.leaveCluster(client, cluster);
		this.removeClusterIfEmpty(cluster);
		delete this.clients[client.id];
	}

	getOrCreateCluster(client) {
		let cluster = getBestFitCluster(client, this.clusters);

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
	for (let clusterId in clusters) {
		if (clusters[clusterId].members.length < CLUSTER_MAX_SIZE) {
			return clusters[clusterId];
		}
	}
	return null;
}

module.exports = Coordinator;
