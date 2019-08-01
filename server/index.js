const Coordinator = require('./src/coordinator');
const store = require('./src/store');
const App = require('./src/app');
const startMockDataStream = require('./src/app/mock');

const coordinator = new Coordinator();
const store = new Store();
const app = new App(store, coordinator);

app.start();
startMockDataStream(store);
