const EventEmitter = require("events");
const _set = require("lodash.set");
const { LogTypes } = require("./constants");

const QUEUE_SIZE = 1 << 20;

class Store extends EventEmitter {
	constructor() {
		super();
		this.snapshot = { offset: -1, value: {} };
	}

	getSnapshot() {
		return this.snapshot;
	}

	set(path, value) {
		this.snapshot.offset++;
		const change = { path, value, offset: this.snapshot.offset };
		_set(this.snapshot.value, path, value);
		this.emit("change", change);
	}
}

module.exports = Store;
