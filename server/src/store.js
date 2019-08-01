// observable object store
// consists of current state object and a message queue

// assume there is only one topic
class Store {
	// queue
	constructor() {
		this.queue = [];
		this.offsets = {};
		this.snapshot = {};
	}

	addConsumer(consumerId) {

	}

	commitOffset(consumerId, offset) {

	}

	removeConsumer(consumerId) {

	}

	enqueueMessage(path, message) {
		// update current snapshot
		// forward to consumer
	}
}

function startMockDataStream() {
	while (true) {
		// randomize add/remove/change operation
		// randomize path
	}
}
