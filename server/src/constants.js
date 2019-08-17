const Messages = {
	Outgoing: {
		// store
		Data: "data",
		// coordinator
		AddEdge: "add_edge",
		RemoveEdge: "remove_edge"
	},
	Incoming: {
		Ack: "data_ack",
		SetId: "set_id",
		AddEdgeResponse: "add_edge_response",
		RemoveEdgeResponse: "remove_edge_response"
	}
};

const LogTypes = {
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

const DashboardMessages = {
	Outgoing: {
		Snapshot: "snapshot",
		Log: "log"
	}
};

module.exports = { Messages, LogTypes, DashboardMessages };
