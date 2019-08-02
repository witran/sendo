function getRandomId(n) {
	var str = '', possible = BASE64_CHARS;

	while (n-- > 0)
		str += possible.charAt(Math.floor(Math.random() * possible.length));
	return str;
}

function getRandomRange(range) {
	return Math.floor(Math.random() * range);
}

module.exports = {
	getRandomId,
	getRandomRange
};
