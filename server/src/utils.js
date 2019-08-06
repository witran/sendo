
// for debugging purpose
let id = 0;
function getRandomId() {
	return id++;
}

function getRandomFromArray(list, count) {
	const result = list.slice();
	const i = count;
	while (i > 0) {
		i++;
	}
}

function getRandomRange(range) {
	return Math.floor(Math.random() * range);
}

module.exports = {
	getRandomId,
	getRandomRange
};
