import React, { Component } from "react";
import io from "socket.io-client";
import { ServerMessages, PeerMessages } from "./utils/constants";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    const socket = io.connect("http://localhost:4321");

    this.id = null;
    this.peerConnections = {};
    this.peerSignaler = null;

    this.state = {
      snapshot: {}
    };

    socket.on("connect", this.handleServerConnect);
    socket.on("event", this.handleServerEvent);
    socket.on("disconnect", this.handleServerDisconnect);
  }

  handleServerConnect(socket) {
    this.setState({ status: "CONNECTED" });
  }

  handleServerEvent(event) {
    switch (event.type) {
      case ServerMessages.Incoming.SetId:
        this.id = event.id;
        this.peerSignaler = new Peer(id, {
          host: "localhost",
          port: 1234,
          path: "/peer"
        });
        this.peerSignaler.on("connection", this.handlePeerConnection);
        break;

      case ServerMesages.Incoming.Data:
        if (event.data.snapshot) {
          // save snapshot, this is first event
        } else if (event.data.messages) {
          // gossip to peers
        }
        break;

      case ServerMessages.Incoming.AddEdge:
        if (event.isInitiator) {
          this.peerConnections[event.neighborId] = this.peerSignaler.connect(
            event.neighborId
          );
          this.peerConnections[event.neighborId].on(
            "open",
            this.handlePeerOpen
          );
          this.peerConnections[event.neighborId].on(
            "data",
            this.handlePeerData
          );
        }
        break;

      case ServerMessages.Incoming.RemoveEdge:
        if (event.isInitiator) {
          this.peerConnections[event.neighborId] = this.peerSignaler.disconnect(
            event.neighborId
          );
          this.peerConnections[event.neighborId].on(
            "close",
            this.handlePeerClose
          );
        }
        break;

      default:
        console.log("UNEXPECTED EVENT:", event);
    }
  }

  handleServerDisconnect() {
    this.setState({ serverStatus: "DISCONNECTED" });
  }

  handlePeerOpen() {}
  handlePeerClose() {}
  handlePeerConnection(conn) {
    conn.on("data", data => {
      this.state.set({
        messages: [...this.state.messages, ...data.messages]
      };
    });
    conn.on("close", this.handlePeerClose);
  }

  handlePeerEvent() {}

  render() {
    return (
      <div className="App">
        <div>
          <h2>Status</h2>
          <p>{status}</p>
        </div>
        <div>
          <h2>Snapshot</h2>
          <p />
        </div>
        <div>
          <h2>Log</h2>
          <p />
        </div>
      </div>
    );
  }
}

export default App;
