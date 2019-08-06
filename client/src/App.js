import React, { Component } from "react";
import io from 'socket.io-client';
import { Store } from
import { Messages } from './utils/constants';
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    const socket = io.connect('http://localhost:4321');

    socket.on('connect', this.handleConnect);
    socket.on('event', this.handleEvent);
    socket.on('disconnect', this.handleDisconnect);
  }

  handleConnect(socket) {
    this.setState({ status: 'CONNECTED' });
  }

  handleEvent(event) {
    switch (event.type) {
      case 'set_id':
        // set peer id
        // send data request
        break;
      case 'data':
        store.update(event.data);
        break;

      case 'add_edge':
        if (event.isInitiator) {
          // form peer link
        }
        break;
      case 'remove_edge':
        if (event.isInitiator) {
          // remove peer link
        }
        break;
      default:
        console.log('UNEXPECTED EVENT:', event);
    }
  }

  handlePeerEvent() {
    if follower
      switch (type) {
        case data

      }
    if leader

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
