import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="App">
        <div>Log</div>
        <div>Snapshot</div>
        <div>Cluster Connectivity Debugger</div>
      </div>
    );
  }
}

export default App;
