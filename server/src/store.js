const _set = require("lodash.set");
const EventEmitter = require("event").EventEmitter;
const Messages = require("./constants").Messages;

const QUEUE_SIZE = 1 << 20;

class Store extends EventEmitter {
	constructor() {
		this.queue = [];
		// for clients who request
		this.snapshot = { offset: -1, value: {} };
		this.ringOffset = 0;
	}

	set(path, value) {
		this.snapshot.offset++;
		const message = { path, value, offset: this.snapshot.offset };
		this.queue.push(message);
		_set(this.snapshot.value, path, value);
		this.emit("message", message);
	}
}

module.exports = Store;
