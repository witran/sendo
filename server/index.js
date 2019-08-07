const Store = require('./src/store');
const Coordinator = require('./src/coordinator');
const Distributor = require('./src/distributor');
const Server = require('./src/server');
const Signaler = require('./src/signaler');
const generateEvents = require('./src/utils').generateEvents;

const coordinator = new Coordinator();
const signaler = new Signaler({ port: 1234 });
const store = new Store();
const distributor = new Distributor(coordinator, { seedRatio: 0.25 });
const server = new Server(signaler, store, coordinator, distributor, { port: 4321 });

server.start();
generateEvents(store);
