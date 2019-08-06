// handle fanout to client using gossip or direct update
// a sweeping background task is used to sweep the remaining un-acked message after 1st phase trying gossip
// sweeping should happen after ACK_WINDOW (5s) after message is sent
// from central server's point of view, gossiping is simply dropping message to less amount of clients
// than the total amount of clients and let the message propagate, the ratio is determined by seedRatio
const getRandomMembers = require("./utils").getRandomMembers;
const ACK_WINDOW = 5000;
const SWEEP_INTERVAL = 100;

class OrderedMap {
	constructor() {
		this.map = {};
		this.firstItem = null;
		this.lastItem = null;
	}
	get(key) {
		return (this.map[key] && this.map[key].value) || null;
	}
	first() {
		return this.firstItem && this.firstItem.value || null;
	}
	insert(key, value) {
		this.map[key] = { key, value, next: null };
		this.lastItem = this.map[key];
		if (!this.firstItem) {
			this.firstItem = this.map[key];
		}
	}
	pop() {
		if (this.firstItem) {
			if (this.lastItem === this.firstItem) {
				this.lastItem = null;
			}
			delete this.map[this.firstItem.key];
			this.firstItem = this.firstItem.next;
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

	sweep() {
		const now = Date.now();
		Object.keys(this.bufferMap).forEach(clientId => {
			const buffer = this.bufferMap[clientId];
			let item = buffer.first();
			while (item && (now - item.sendTs > ACK_WINDOW)) {
				if (!item.ack) {
					this.clients[clientId].send("event", {
						item.message
					});
				}
				buffer.pop();
				// ignore future ack at this point, let ping detect & disconnect client
				item = buffer.first();
			}
		});
	}

	addClient(client) {
		this.bufferMap[client.id] = new OrderedMap();
		this.clients[clientId] = client;
	}

	removeClient(clientId) {
		delete this.bufferMap[clientId];
		delete this.clients[clientId];
	}

	broadcast(message) {
		this.coordinator.getClusters().each(cluster => {
			// gossip on fully connected members
			const readyMembers = cluster.members.filter(member => member.isReady);
			const seedingMembers = getRandomMembers(
				readyMembers,
				Math.round(seedRatio * readyMembers.length)
			);

			seedingMembers.forEach(member => {
				this.send(member, message);
			});

			// direct send for members that is still establishing connection
			const newMembers = cluster.members
				.filter(member => !member.isReady)
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

		this.bufferMap[client.id].insert(offset, {
			sendTs: Date.now(),
			ack: false,
			message: message
		});
	}

	// mark ack & prune sequential ack
	handleAck(client, offset) {
		const buffer = this.bufferMap[client.id];
		let item = buffer.get(offset);
		item.ack = true;

		if (item === buffer.first) {
			while (item && item.ack === true) {
				buffer.pop();
				item = buffer.first();
			}
		}
	}
}
