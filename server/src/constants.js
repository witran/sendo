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
		Ack: "ack",
		SetId: "set_id"
	}
};

module.exports = { Messages };
