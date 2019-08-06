const ServerMessages = {
	Incoming: {
		// store
		Data: "data",
		// coordinator
		SetId: "set_id",
		AddEdge: "add_edge",
		RemoveEdge: "remove_edge"
	},
	OutGoing: {
		StartStream: "start_stream",
		PeerConnected: "peer_connected",
		PeerDisconnected: "peer_disconnected",
		Ack: "ack"
	}
};

const PeerMessages = {
	Data: "data"
};

exports.default = Messages;
