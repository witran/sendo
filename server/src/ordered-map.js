class OrderedMap {
	constructor() {
		this._map = {};
		this._first = null;
		this._last = null;
	}
	append(key, value) {
		const item = { value, next: null, prev: this._last };

		this._map[key] = item;

		if (this._last) {
			this._last.next = item;
		}
		if (!this._first) {
			this._first.next = item;
		}
		this._last = item;
	}
	get(key) {
		return (this._map[key] && this._map[key].value) || null;
	}
	getFirst() {
		return this._first && this._first.value || null;
	}
	remove(key) {
		const item = this._map[key];

		if (!item) return;

		if (item === this._first) {
			this._first = item.next;
		}
		if (item === this._last) {
			this._last = item.prev;
		}

		if (item.prev) {
			item.prev.next = item.next;
		}
		if (item.next) {
			item.next.prev = item.prev;
		}

		delete this._map[key];
	}
}

module.exports = OrderedMap;
