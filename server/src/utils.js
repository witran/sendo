let id = 0;
function getRandomId() {
	return id++; // for debug
}

function getRandomMembers(list, count) {
	if (list.length === 1) return list[0];
	const remaining = list.slice();
	const result = [];
	for (let i = 0; i < count; i++) {
		result.push(remaining.splice(getRandomRange(remaining.length), 1)[0]);
	}
	return result;
}

function getRandomRange(range) {
	return Math.floor(Math.random() * range);
}

const lorem =
	"Donec vestibulum quis urna cursus fermentum. Proin ipsum mauris, egestas vitae vulputate vitae, gravida a sapien. Vivamus tempor suscipit elit, ac bibendum velit tempor vel. Morbi vel varius eros, eget lobortis velit. Sed eleifend euismod augue sed rhoncus. Fusce ullamcorper mi gravida ante vulputate aliquam. Pellentesque faucibus, erat at viverra accumsan, nulla quam fermentum leo, nec varius metus nulla sit amet enim. Nullam a eros eu purus iaculis volutpat a eu mi. Cras vel finibus arcu, non porta orci. Nam porta sagittis convallis. Aenean porta maximus odio elementum venenatis. Sed congue augue ac urna pharetra, at finibus libero imperdiet. Proin ornare sodales ex, sed tristique lectus pretium et. Pellentesque molestie odio quis imperdiet fringilla. Aenean aliquet iaculis tortor, id molestie neque luctus vitae. Sed interdum arcu magna, quis rhoncus nisi bibendum eget. Nunc ac diam in risus hendrerit bibendum vitae eu turpis. Integer egestas lacinia tempus. Nam dapibus lorem nibh. Suspendisse neque mi, suscipit quis rhoncus fermentum, vestibulum faucibus orci.";

function getRandomString(minLength, maxLength) {
	const length =
		minLength + Math.floor(Math.random() * (maxLength - minLength));
	const start = Math.floor(Math.random() * (lorem.length - length));
	return lorem.slice(start, start + length);
}

const users = {};
const interval = 500;
const maxId = 20;

function generateEvents(store) {
	setInterval(function() {
		const userId = getRandomRange(maxId);
		const message = getRandomString(100, 200);
		const ts = Date.now();
		if (!users[userId]) {
			users[userId] = true;
			store.set(`users.${userId}`, {
				firstMessageTs: ts,
				firstMessage: message,
				lastMessageTs: ts,
				lastMessage: message
			});
		} else {
			if (Math.random() > 0.5) {
				store.set(`users.${userId}`, {
					lastMessageTs: ts,
					lastMessage: message
				});
			}
		}
	}, interval);
}

module.exports = {
	generateEvents,
	getRandomId,
	getRandomRange,
	getRandomString,
	getRandomMembers
};
