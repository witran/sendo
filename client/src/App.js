import React, { Component } from "react";
import logo from "./logo.svg";
import io from 'socket.io-client';
import "./App.css";

const MESSAGE_TYPES = {
  POLL_RESPONSE: 'poll_response',
  SET_ID: 'set_id',
  ADD_EDGE: 'add_edge',
  REMOVE_EDGE: 'remove_edge',
  SET_LEADER: 'set_leader'
};

class App extends Component {
  constructor(props) {
    super(props);

    const socket = io.connect('http://localhost:4321');

    socket.on('connect', this.handleConnect);
    socket.on('event', this.handleEvent);
    socket.on('disconnect', this.handleDisconnect);
  }

  handleConnect() {
    this.setState({ status: 'CONNECTED' });
  }

  handleEvent() {
    switch (type) {
      case data
      case set_leader
      case

    }
  }

  handleDisconnect() {
    this.setState({ status: 'DISCONNECTED' });
  }

  render() {
    return (
      <div className="App">
        <div>
          <h2>Status</h2>
          <p>{status}</p>
        </div>
        <div>
          <h2>Snapshot</h2>
          <p></p>
        </div>
        <div>
          <h2>Log</h2>
          <p></p>
        </div>
      </div>
    );
  }
}

export default App;
