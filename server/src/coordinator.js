const getRandomId = require("./utils").getRandomId;
const Messages = require("./constants").Messages;
const CLUSTER_MAX_SIZE = 4;

class Coordinator {
	constructor() {
		this.clients = {};
		this.clusters = {};
		// store client peer state
	}

	addNode(client) {
		const cluster = this.getOrCreateCluster(client);
		this.joinNodeToCluster(client, cluster);
	}

	getOrCreateCluster(client) {
		let cluster = getBestFitCluster(client, this.clusters);

		if (!cluster) {
			cluster = {
				id: getRandomId(16),
				members: []
			};
			clusters[cluster.id] = cluster;
			client.isLeader = true;
		}

		client.cluster = cluster;
		this.clients[client.id] = client;
	}

	joinNodeToCluster(client, cluster) {
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

	removeNode(id) {
		const client = this.clients[id];
		const cluster = client.cluster;

		cluster.members.splice(cluster.members.indexOf(client), 1);

		if (cluster.members.length && client.isLeader) {
			cluster.members[0].isLeader = true;
			cluster.members[0].socket.emit("event", {
				type: Messages.Outgoing.SetLeader
			});
		}

		cluster.members.forEach(function(member) {
			member.socket.emit("event", {
				type: Messages.Outgoing.RemoveEdge,
				neighborId: client.id,
				isInitiator: true
			});
			member.socket.emit("event", {
				type: Messages.Outgoing.RemoveEdge,
				neighborId: member.id
			});
		});
	}
}

function getBestFitCluster(client, clusters) {
	for (let clusterId in clusters) {
		if (cluster.size < CLUSTER_MAX_SIZE) {
			return clusters[clusterId];
		}
	}
	return null;
}

module.exports = Coordinator;
