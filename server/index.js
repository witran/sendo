const Store = require("./src/store");
const Coordinator = require("./src/coordinator");
const Sender = require("./src/sender");
const Signaler = require("./src/signaler");
const Server = require("./src/server");
const Dashboard = require("./src/dashboard");

const generateEvents = require("./src/utils").generateEvents;

const coordinator = new Coordinator({ clusterSize: 4 });
const signaler = new Signaler({ port: 1234 });
const store = new Store();
const sender = new Sender(coordinator, { seedRatio: 0.25 });
const server = new Server(store, coordinator, sender, { port: 4321 });
const dashboard = new Dashboard(server, { port: 4444 });

signaler.start();
server.start();
dashboard.start();
generateEvents(store, { interval: 200 });
