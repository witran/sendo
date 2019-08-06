// handle fanout to client using gossip or direct update
// a sweeping background task is used to sweep the remaining un-acked message after 1st phase trying gossip
// sweeping will happen after ACK_WINDOW (5s) after message is sent to allow gossip enough time to send ack
// from central server's point of view, gossiping is simply dropping message to less amount of clients
// than the total amount of clients and let the message propagate, the ratio is determined by seedRatio
const getRandomMembers = require("./utils").getRandomMembers;
const ACK_WINDOW = 5000;
const SWEEP_INTERVAL = 100;

class OrderedMap {
	constructor() {
		this.map = {};
		this.first = null;
		this.last = null;
	}
	// insert in last position
	insert(key, value) {
		const item = { key, value, next: null, prev: this.last };

		this.map[key] = item;

		if (this.last) {
			this.last.next = item;
		}
		if (!this.first) {
			this.first.next = item;
		}
		this.last = item;
	}
	get(key) {
		return (this.map[key] && this.map[key].value) || null;
	}
	getFirst() {
		return this.first && this.first.value || null;
	}
	remove(key) {
		const item = this.map[key];

		if (!item) return;

		delete this.map[key];

		if (item === this.first) {
			this.first = item.next;
		}
		if (item === this.last) {
			this.last = item.last;
		}

		if (item.prev) {
			item.prev.next = item.next;
		}
		if (item.next) {
			item.next.prev = item.prev;
		}
	}
	removeFirst() {
		if (this.first) {
			this.remove(this.first.key);
		}
	}
}

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
			while (item && (now - item.sendTs > ACK_WINDOW)) {
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
			const readyMembers = cluster.members.filter(member => member.isReadyForGossip);
			const seedingMembers = getRandomMembers(
				readyMembers,
				Math.round(seedRatio * readyMembers.length)
			);

			seedingMembers.forEach(member => {
				this.send(member, message);
			});

			// direct send for members that is still establishing connection
			const newMembers = cluster.members
				.filter(member => !member.isReadyForGossip)
				.forEach(member => {
					this.send(member, message);
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
			sendTs: Date.now(),
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
