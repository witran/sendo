const _set = require('lodash.set');

class Store {
	constructor() {
		this.queue = [];
		this.snapshot = { offset: -1, value: {} };
		this.consumers = {};
	}

	addConsumer(client) {
		client.socket.on('POLL', this.handlePollRequest);
	}

	handlePollRequest({ offset, reqId }) {
		if (offset && offset >= 0) {
			const messages = queue.slice(offset);
			client.socket.emit('MESSAGES', { data: messages, reqId );
		} else {
			client.socket.emit('SNAPSHOT', { data: this.snapshot, reqId );
		}
	}

	removeConsumer(clientId) {
		client.socket.off('REQUEST', this.handlePollRequest);
	}

	set(path, value) {
		this.snapshot.offset++;
		this.queue.push({ path, value });
		_set(this.snapshot.value, path, value);
	}
}

module.exports = Store;
