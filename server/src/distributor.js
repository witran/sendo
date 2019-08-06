// distributor handles fanout to client using a gossip phase before direct update

// from central server's point of view, gossipping is simply sending message to a few seeders
// compared to sending to all nodes, the seeders/clients ratio is determined by seedRatio
// to determine seeders, distributor needs to have knowledge of network topology

// a background task is used to sweep the remaining un-acked message after the gossip phase
// sweeping will happen <GOSSIP_ACK_WINDOW> ms after message is sent to seeders

// we can use a lru cache for each connection, cache duration is <GOSSIP_ACK_WINDOW>
// on cache item timeout, if ack is not received, send an extra message from server

const getRandomMembers = require("./utils").getRandomMembers;
const OrderedMap = require("./ordered-map");
const GOSSIP_ACK_WINDOW = 3000;
const SWEEP_INTERVAL = 100;

class Distributor {
	constructor(coordinator, { seedRatio }) {
		this.coordinator = coordinator;
		this.seedRatio = seedRatio || 0.25;
		this.bufferMap = {}; // map of (client id - ordered map of (offset - { ts, message }))
		this.clients = {}; // map of (client id - client)
		this.sweepTimer = setInterval(this.sweep.bind(this), SWEEP_INTERVAL);
	}

	sweep() {
		const now = Date.now();
		Object.keys(this.bufferMap).forEach(clientId => {
			const buffer = this.bufferMap[clientId];
			if (!buffer) return;

			let item = buffer.getFirst();
			while (item && (now - item.ts > GOSSIP_ACK_WINDOW)) {
				this.clients[clientId].socket.emit("event", {
					type: Messages.Outgoing.Data,
					data: {
						messages: [item.message]
					}
				});

				buffer.remove(item.offset);
				item = buffer.getFirst();
			}
		});
	}

	addClient(client) {
		this.bufferMap[client.id] = new OrderedMap();
		this.clients[client.id] = client;
	}

	removeClient(client) {
		delete this.bufferMap[client.id];
		delete this.clients[client.id];
	}

	broadcast(message) {
		console.log('broadcast', message);
		Object.values(this.coordinator.clusters).forEach(cluster => {
			// randomized seeder
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
		client.socket.emit("event", {
			type: Messages.Outgoing.Data,
			data: {
				messages: [message]
			}
		});

		const buffer = this.bufferMap[client.id];
		if (!buffer) return;

		buffer.append(offset, {
			ts: Date.now(),
			message,
			offset
		});
	}

	// record ack & prune from buffer
	handleAck(client, offset) {
		const buffer = this.bufferMap[client.id];
		if (!buffer) return;
		buffer.remove(offset);
	}
}

module.exports = Distributor;
