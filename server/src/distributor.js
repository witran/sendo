// handle fanout to client using gossip or direct update
// a sweeping background task is used to sweep the remaining un-acked message after 1st phase trying gossip
// sweeping will happen <GOSSIP_WINDOW> ms after message is sent to allow gossip enough time to send ack
// from central server's point of view, gossiping is simply sending message to less amount of clients
// than the total amount of clients and let the message propagate itself through p2p links,
// the seed/clients ratio is determined by seedRatio
const getRandomMembers = require("./utils").getRandomMembers;
const OrderedMap = require("./ordered-map");
const GOSSIP_WINDOW = 3000;
const SWEEP_INTERVAL = 100;

class Distributor {
	constructor(coordinator, { seedRatio }) {
		this.seedRatio = seedRatio;
		this.bufferMap = {}; // map of (client id - ordered map of (offset - sentTs)
		this.clients = {}; // map of (client id - client)
		this.sweepTimer = setInterval(this.sweep, SWEEP_INTERVAL);
	}

	sweep = () => {
		const now = Date.now();
		Object.keys(this.bufferMap).forEach(clientId => {
			const buffer = this.bufferMap[clientId];
			if (!buffer) return;

			let item = buffer.getFirst();
			while (item && now - item.ts > GOSSIP_WINDOW) {
				this.clients[clientId].send("event", {
					type: Messages.Outgoing.Data,
					data: {
						messages: [message]
					}
				});

				buffer.removeFirst();
				item = buffer.getFirst();
			}
		});
	};

	addClient(client) {
		this.bufferMap[client.id] = new OrderedMap();
		this.clients[client.id] = client;
	}

	removeClient(client) {
		delete this.bufferMap[client.id];
		delete this.clients[client.id];
	}

	broadcast(message) {
		this.coordinator.getClusters().each(cluster => {
			// gossip on fully connected members
			// const readyMembers = cluster.members.filter(
			// 	member => member.isReadyForGossip
			// );
			// const seedingMembers = getRandomMembers(
			// 	readyMembers,
			// 	Math.round(this.seedRatio * readyMembers.length)
			// );

			// seedingMembers.forEach(member => {
			// 	this.send(member, message);
			// });

			// // direct send for members that is still establishing connection
			// const newMembers = cluster.members
			// 	.filter(member => !member.isReadyForGossip)
			// 	.forEach(member => {
			// 		this.send(member, message);
			// 	});

			const seedingClients = getRandomFromArray(
				cluster.members,
				Math.round(this.seedRatio * cluster.members.length)
			);

			seedingClients.forEach(client => {
				this.send(client, message);
			});
		});
	}

	send(client, message) {
		client.socket.send("event", {
			type: Messages.Outgoing.Data,
			data: {
				messages: [message]
			}
		});

		const buffer = this.bufferMap[client.id];
		if (!buffer) return;

		buffer.insert(offset, {
			ts: Date.now(),
			message: message
		});
	}

	// record ack & prune sequential ack
	handleAck(client, offset) {
		const buffer = this.bufferMap[client.id];
		if (!buffer) return;
		buffer.removeItem(offset);
	}
}

module.exports = Distributor;
