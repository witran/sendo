const _set = require('lodash.set');

class Store {
	constructor() {
		this.queue = [];
		this.snapshot = { offset: -1, value: {} };
		this.consumers = {};
	}

	addConsumer(client) {
		client.socket.on('POLL', this.handlePoll);
	}

	handlePoll({ offset, reqId }) {
		if (offset && offset >= 0) {
			const messages = queue.slice(offset);
			client.socket.emit('DATA', { data: { messages }, reqId );
		} else {
			client.socket.emit('DATA', { data: { snapshot: this.snapshot }, reqId );
		}
	}

	removeConsumer(clientId) {
		client.socket.off('POLL', this.handlePoll);
	}

	set(path, value) {
		this.snapshot.offset++;
		this.queue.push({ path, value });
		_set(this.snapshot.value, path, value);
	}
}

module.exports = Store;
