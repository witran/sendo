// for debugging purpose
let id = 0;
function getRandomId() {
	return id++;
}

function getRandomFromArray(list, count) {
	const remaining = list.slice();
	const result = [];
	const i = count;
	while (i > 0) {
		result.push(remaining.splice(getRandomRange(remaining.length));
		i--;
	}
}

function getRandomRange(range) {
	return Math.floor(Math.random() * range);
}

module.exports = {
	getRandomId,
	getRandomRange
};
