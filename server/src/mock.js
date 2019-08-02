const getRandomRange = require('./utils').getRandomRange;
const props = ['lastMessageTs', 'lastMessage', 'firstMessage', 'firstMessageTs'];
const visitors = {};

function startMockDataStream(store) {
	while (true) {
		visitorId = getRandomRange(100);
		if (!visitors[visitorId]) {
			store.set(`visitors.${visitorId}.${prop}`, value);
		}
	}
}

module.exports = { startMockDataStream };
