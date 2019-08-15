export const LogTypes = {
	Server: {
		ClientInit: "server.client_init",
		ClientEvent: "server.client_event",
		ClientDisconnect: "server.client_disconnect"
	},
	Sender: {
		Send: "sender.send",
		Ack: "sender.ack"
	},
	Store: {
		Update: "store.update"
	},
	Coordinator: {
		AddClient: "coordinator.add_client",
		RemoveClient: "coordinator.remove_client",
		AddEdge: "coordinator.add_edge",
		RemoveEdge: "coordinator.remove_edge"
	}
};

export const DashboardMessages = {
	Incoming: {
		Snapshot: "snapshot",
		Log: "log"
	},
	Outgoing: {
		SetSeedRatio: "set_seed_ratio",
		SetClusterSize: "set_cluster_size"
	}
};
