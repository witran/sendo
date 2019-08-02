const getRandomId = require('./utils').getRandomId;
const CLUSTER_MAX_SIZE = 4;

class Coordinator {
	constructor() {
		this.nodes = {};
		this.clusters = {};
	}

	addNode(client) {
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
		this.nodes[client.id] = client;

		cluster.members.forEach(function(member) {
			member.socket.emit('ADD_EDGE', [member.id, client.id]);
			client.socket.emit('ADD_EDGE', [member.id, client.id]);
		});

		cluster.members.push(client);
	}

	removeNode(id) {
		const client = this.nodes[id];
		const cluster = client.cluster;

		cluster.members.splice(cluster.members.indexOf(client), 1);

		if (cluster.members.length && client.isLeader) {
			cluster.members[0].isLeader = true;
			cluster.members[0].socket.emit('SET_LEADER', true);
		}

		cluster.members.forEach(function(member) {
			member.socket.emit('REMOVE_EDGE', [member.id, client.id]);
			client.socket.emit('REMOVE_EDGE', [member.id, client.id]);
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
