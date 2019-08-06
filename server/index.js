const Coordinator = require('./src/coordinator');
const Store = require('./src/store');
const App = require('./src/server');
const generateEvents = require('./src/mock');

const coordinator = new Coordinator();
const signaler = new Signaler({ port: 1234 });
const store = new Store();
const server = new Server(store, coordinator, { port: 4321 });

signaler.start();
server.start();
generateEvents(store);
