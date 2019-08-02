const Coordinator = require('./src/coordinator');
const Store = require('./src/store');
const App = require('./src/app');
const startStream = require('./src/mock');

const coordinator = new Coordinator();
const store = new Store();
const peerServer = new PeerServer({ port: 1234 });
const app = new App(store, coordinator, { port: 4321 });

peerServer.start();
app.start();
startStream(store);
