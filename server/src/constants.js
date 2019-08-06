const Messages = {
	Outgoing: {
		// store
		Data: "data",
		// coordinator
		SetId: "set_id",
		AddEdge: "add_edge",
		RemoveEdge: "remove_edge"
	},
	Incoming: {
		// StartStream: "start_stream",
		// PeerConnected: "peer_connected",
		// PeerDisconnected: "peer_disconnected",
		Ack: "ack"
	}
};

module.exports = { Messages };
