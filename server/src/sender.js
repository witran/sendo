// Sender handles fanout to client using a gossip phase before direct update

// from central server's point of view, gossipping is simply sending message to a few seeders
// compared to sending to all nodes, the seeders/clients ratio is determined by seedRatio
// to determine seeders, Sender needs to have knowledge of network topology

// a background task is used to sweep the remaining un-acked message after the gossip phase
// sweeping will happen <GOSSIP_ACK_WINDOW> ms after message is sent to seeders
// to achieve this, we can use a lru cache for each connection, cache duration is <GOSSIP_ACK_WINDOW>
// on cache item timeout, if ack is not received, send an extra message from server
const EventEmitter = require("events");
const OrderedMap = require("./ordered-map");
const { getRandomMembers } = require("./utils");
const { Messages, LogTypes } = require("./constants");
const GOSSIP_ACK_WINDOW = 3000;
const SWEEP_INTERVAL = 100;

class Sender extends EventEmitter {
	constructor(coordinator, { seedRatio }) {
		super();
		this.coordinator = coordinator;
		this.seedRatio = seedRatio || 0.25;
		this.bufferMap = {}; // map of (client id - ordered map of (offset - { ts, message }))
		this.clients = {}; // map of (client id - client)
		this.sweepTimer = setInterval(this.sweep.bind(this), SWEEP_INTERVAL);
		this.totalAck = 0;
		this.totalPeerAck = 0;
		setInterval(() => {
			console.log(
				"PEER EFFICIENCY:",
				this.totalAck
					? (
							((this.totalPeerAck * 1.0) / this.totalAck) *
							100
					  ).toFixed(2) + "%"
					: "N/A"
			);
			this.totalAck = 0;
			this.totalPeerAck = 0;
		}, 3000);
	}

	sweep() {
		const now = Date.now();

		Object.keys(this.bufferMap).forEach(clientId => {
			const buffer = this.bufferMap[clientId];

			if (!buffer) return;

			let item = buffer.getFirst();

			while (item && now - item.ts > GOSSIP_ACK_WINDOW) {
				this.send(this.clients[clientId], [item.message]);
				buffer.remove(item.message.offset);
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
		Object.values(this.coordinator.clusters).forEach(cluster => {
			// randomized seeder
			const seedingClients = getRandomMembers(
				cluster.members,
				Math.round(this.seedRatio * cluster.members.length)
			);

			seedingClients.forEach(client => {
				this.send(client, [message]);
			});
		});

		Object.values(this.clients).forEach(client => {
			const buffer = this.bufferMap[client.id];

			if (!buffer) return;

			buffer.append(message.offset, {
				ts: Date.now(),
				message
			});
		});
	}

	send(client, messages) {
		client.socket.emit("event", {
			type: Messages.Outgoing.Data,
			data: { messages }
		});
		this.emit("log", {
			type: LogTypes.Sender.Send,
			client: client.id,
			offsets: messages.map(message => message.offset)
		});
	}

	// record acks & remove from buffer
	handleAck(client, offsets, from) {
		if (from !== "server") {
			this.totalPeerAck++;
		}
		this.totalAck++;
		console.log("ack:", offsets, client.id, "from:", from);
		offsets.forEach(offset => {
			const buffer = this.bufferMap[client.id];

			if (!buffer) return;
			buffer.remove(offset);
		});
		this.emit("log", {
			type: LogTypes.Sender.Ack,
			offsets: offsets,
			client: client.id,
			from
		});
	}
}

module.exports = Sender;
