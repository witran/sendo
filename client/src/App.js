import React, { Component } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { ServerMessages } from "./constants";
import _set from "lodash.set";
import "./App.css";

const signalerHost = "localhost";
const signalerPort = 1234;
const signalerPath = "peer";
const signalerHeartbeatInterval = 20000;
const WS_ADDRESS = "http://localhost:4321";

const base64 =
  "+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function getRandomId(n) {
  let str = "";

  while (n-- > 0) {
    str += base64.charAt(Math.floor(Math.random() * base64.length));
  }
  return str;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.id = null;
    this.peerConnections = {};
    this.fragments = [];

    // init signaler
    this.signaler = new Peer(getRandomId(16), {
      host: signalerHost,
      port: signalerPort,
      path: signalerPath
    });
    this.signaler.on("open", this.handleSignalerOpen.bind(this));
    this.signaler.on("close", this.handleSignalerClose.bind(this));

    this.state = {
      entryPoint: false,
      snapshot: {},
      offset: -1,
      wsStatus: "INIT",
      signalerStatus: "INIT"
    };
  }

  handleSignalerOpen() {
    console.log("OPENED SIGNALER CONNECTION", this.signaler.id);
    this.setState({ signalerStatus: "CONNECTED" });

    this.signaler.on("connection", this.handleSignalerConnection.bind(this));
    this.signaler.on("error", this.handleSignalerError.bind(this));

    // start heartbeat
    this.signalerHeartbeat = setInterval(() => {
      if (this.signaler.socket._wsOpen()) {
        this.signaler.socket.send({ type: "HEARTBEAT" });
      }
    }, signalerHeartbeatInterval);

    // start main server connection
    this.id = this.signaler.id;
    this.socket = io.connect(WS_ADDRESS);

    this.socket.on("connect", this.handleServerConnect.bind(this));
    this.socket.on("event", this.handleServerEvent.bind(this));
    this.socket.on("disconnect", this.handleServerDisconnect.bind(this));
  }

  handleSignalerClose() {
    console.log("CLOSED SIGNALER CONNECTION");
    this.setState({
      signalerStatus: "DESTROYED"
    });
    clearInterval(this.signalerHeartbeat);
  }

  handleServerConnect(socket) {
    console.log("MAIN SERVER CONNECTED");
    this.socket.emit("event", {
      type: ServerMessages.Outgoing.SetId,
      id: this.id
    });
    this.setState({ wsStatus: "CONNECTED" });
  }

  handleServerEvent(event) {
    switch (event.type) {
      // case ServerMessages.Incoming.SetId:
      // this.id = event.id;
      // console.log("SET ID", this.id);
      // this.signaler = new Peer(this.id, {
      //   host: signalerHost,
      //   port: signalerPort,
      //   path: signalerPath
      // });
      // this.signaler.on(
      //   "connection",
      //   this.handleSignalerConnection.bind(this)
      // );
      // this.signaler.on("open", this.handleSignalerOpen.bind(this));
      // this.signaler.on("error", this.handleSignalerError.bind(this));

      // // pass the peer instance, and it will start sending heartbeats
      // const heartbeater = createHeartbeater(this.signaler);
      // heartbeater.start();

      // // stop them later
      // // heartbeater.stop();

      // function createHeartbeater(peer) {
      //   let timeoutId = 0;
      //   function heartbeat() {
      //     timeoutId = setTimeout(heartbeat, 20000);
      //     if (peer.socket._wsOpen()) {
      //       peer.socket.send({ type: "HEARTBEAT" });
      //     }
      //   }
      //   // return
      //   return {
      //     start: function() {
      //       if (timeoutId === 0) {
      //         heartbeat();
      //       }
      //     },
      //     stop: function() {
      //       clearTimeout(timeoutId);
      //       timeoutId = 0;
      //     }
      //   };
      // }
      // break;

      case ServerMessages.Incoming.Data: {
        if (event.data.snapshot) {
          const { value, offset } = event.data.snapshot;

          this.setState({
            snapshot: value,
            offset
          });
        } else if (event.data.messages) {
          this.setState({ entryPoint: true });
          // send ack
          this.socket.emit("event", {
            type: ServerMessages.Outgoing.Ack,
            from: "server",
            offsets: event.data.messages.map(({ offset }) => offset)
          });

          const messages = event.data.messages.filter(
            message => message.offset >= this.state.offset
          );

          // insert into fragment array,
          // fragment array temporarily stores messages that are delivered out of order
          messages.forEach(message => {
            this.fragments[message.offset - this.state.offset - 1] = message;
          });

          // shift & process in-order messages until reaching an offset not yet received
          const snapshot = this.state.snapshot;
          let offset = this.state.offset;
          // console.log('received message', this.fragments, this.state.offset);
          while (this.fragments[0]) {
            const message = this.fragments.shift();
            _set(snapshot, message.path, message.value);
            offset = message.offset;
          }
          console.log(
            "fragments:",
            this.fragments.length,
            "offset:",
            this.state.offset
          );
          this.setState({
            snapshot,
            offset
          });

          // forward to peers
          Object.keys(this.peerConnections).forEach(neighborId => {
            const conn = this.peerConnections[neighborId];
            if (conn) {
              conn.send({ messages: event.data.messages });
            }
          });
        }
        break;
      }

      case ServerMessages.Incoming.AddEdge: {
        const { isInitiator, neighborId } = event;
        console.log("server add edge", neighborId, isInitiator);
        if (isInitiator) {
          const conn = this.signaler.connect(neighborId, {
            metadata: { id: this.id }
          });
          this.peerConnections[neighborId] = conn;
          console.log("attempting connect from initiator", conn);
          if (conn) {
            conn.on("open", () => {
              console.log("INITIATOR OPEN CALLBACK");
            });
            conn.on("data", this.handlePeerData.bind(this));
            conn.on("close", () => {
              this.handlePeerClose(neighborId);
            });
          }
        }
        break;
      }

      case ServerMessages.Incoming.RemoveEdge: {
        const { isInitiator, neighborId } = event;
        console.log("server remove edge", neighborId, isInitiator);
        if (isInitiator) {
          this.peerConnections[event.neighborId] = this.signaler.disconnect(
            neighborId
          );
        }
        break;
      }

      default:
        console.log("UNEXPECTED EVENT:", event);
    }
  }

  handleServerDisconnect() {
    this.setState({ wsStatus: "DISCONNECTED" });
  }

  handlePeerOpen() {}

  handlePeerData(data) {
    console.log("DATA FROM PEER", data, data.messages);
    this.setState({ entryPoint: false });
    // send ack
    this.socket.emit("event", {
      type: ServerMessages.Outgoing.Ack,
      from: "peer",
      offsets: data.messages.map(({ offset }) => offset)
    });

    const messages = data.messages.filter(
      message => message.offset >= this.state.offset
    );

    // insert into fragment array
    messages.forEach(message => {
      this.fragments[message.offset - this.state.offset - 1] = message;
    });
    // shift & process
    // O(n), to be improved with BST or OrderedMap & a background process timer
    // unshift fragment array & update state snapshot
    // until reaching undefined item (either not received yet, or end of fragment)
    const snapshot = this.state.snapshot;
    let offset = this.state.offset;
    // console.log('received message', this.fragments, this.state.offset);
    while (this.fragments[0]) {
      const message = this.fragments.shift();
      _set(snapshot, message.path, message.value);
      offset = message.offset;
    }
    console.log(
      "fragments:",
      this.fragments.length,
      "offset:",
      this.state.offset
    );
    this.setState({
      snapshot,
      offset
    });
  }

  handlePeerClose(neighborId) {
    delete this.peerConnections[neighborId];
    console.log("CLOSED PEER CONNECTION");
  }

  handleSignalerError(e) {
    console.log("SIGNALER ERROR", e);
  }

  handleSignalerConnection(conn) {
    console.log("RECEIVED PEER CONNECTION", conn);
    const neighborId = conn.metadata.id;
    this.peerConnections[neighborId] = conn;
    conn.on("open", this.handlePeerOpen.bind(this));
    conn.on("data", this.handlePeerData.bind(this));
    conn.on("close", () => {
      this.handlePeerClose(neighborId);
    });
  }

  handleSignalerDisconnect(conn) {
    console.log("RECEIVED PEER DISCONNECTION", conn);
  }

  render() {
    const {
      snapshot,
      offset,
      wsStatus,
      signalerStatus,
      entryPoint
    } = this.state;
    const classList = ["App", entryPoint ? "entry" : "delegate"].join(" ");
    return (
      <div className={classList}>
        <div>
          <h2>Status</h2>
          <p>Data Server: {wsStatus}</p>
          <p>Peer Server: {signalerStatus} </p>
        </div>
        <div>
          <h2>Snapshot</h2>
          <p>Offset: {offset}</p>
          <p>Snapshot: {JSON.stringify(snapshot)}</p>
        </div>
      </div>
    );
  }
}

export default App;
