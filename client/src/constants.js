export const ServerMessages = {
	Incoming: {
		// store
		Data: "data",
		// coordinator
		// SetId: "set_id",
		AddEdge: "add_edge",
		RemoveEdge: "remove_edge"
	},
	Outgoing: {
		// StartStream: "start_stream",
		// PeerConnected: "peer_connected",
		// PeerDisconnected: "peer_disconnected",
		Ack: "ack",
		SetId: "set_id"
	}
};

export const PeerMessages = {
	Data: "data"
};
