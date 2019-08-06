class OrderedMap {
	constructor() {
		this.map = {};
		this.first = null;
		this.last = null;
	}
	append(key, value) {
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

module.exports = OrderedMap;
