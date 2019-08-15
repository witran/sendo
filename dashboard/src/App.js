import _get from "lodash.get";
import io from "socket.io-client";
import React, { Component } from "react";
import { ForceGraph2D as ForceGraph } from "react-force-graph";
import { LogTypes, DashboardMessages } from "./constants";
import { getViewport } from "./utils";
import styles from "./App.css";

const WS_ADDRESS = "localhost:4444";

function getGraphData({ clusters }) {
  const nodes = [{ id: "root", color: "red" }];
  const links = [];
  Object.values(clusters).forEach(({ members }) => {
    members.forEach(id => {
      nodes.push({ id, color: "green" });
      links.push({
        source: id,
        target: "root",
        distance: 60,
        curvature: 0.05,
        rotation: Math.PI / 2,
        color: "white"
      });
      links.push({
        source: "root",
        target: id,
        distance: 60,
        curvature: 0.05,
        rotation: Math.PI * 1.5,
        color: "white"
      });
    });
    for (let i = 0; i < members.length; i++)
      for (let j = i + 1; j < members.length; j++) {
        links.push({
          source: members[i],
          target: members[j],
          distance: 20,
          curvature: 0.05,
          rotation: Math.PI / 2,
          color: "white"
        });
        links.push({
          source: members[j],
          target: members[i],
          distance: 20,
          curvature: 0.05,
          rotation: Math.PI * 1.5,
          color: "white"
        });
      }
  });
  console.log("nodes", nodes);
  console.log("links", links);
  return { nodes, links };
}

class App extends Component {
  constructor(props) {
    super(props);

    this.socket = io.connect(WS_ADDRESS);
    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("event", this.handleEvent.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));

    this.state = {
      clusters: {},
      buffers: {},
      store: {},

      seedRatio: 1,
      clusterSize: 4,

      status: "INIT"
    };

    window.addEventListener("resize", () => {
      this.forceUpdate();
    });
  }

  handleConnect() {
    this.setState({ status: "CONNECTED " });
  }

  handleEvent(event) {
    switch (event.type) {
      case DashboardMessages.Incoming.Snapshot: {
        console.log("SNAPSHOT", event.snapshot);
        const { coordinator, sender, store, clients } = event.snapshot;
        this.setState({
          clusters: coordinator.clusters,
          // buffers: sender.bufferMap,
          clients,
          store,

          clusterSize: coordinator.clusterSize
          // seedRatio: sender.seedRatio,
        });
        break;
      }
      case DashboardMessages.Incoming.Log: {
        // console.log("LOG", event, event.log);
        switch (event.log.type) {
          case LogTypes.Coordinator.AddClient: {
            const { cluster, client } = event.log;
            const { clusters } = this.state;
            const members = clusters[cluster].members || [];
            console.log({
              clusters: {
                ...clusters,
                cluster: {
                  id: cluster,
                  members:
                    members.indexOf(client) === -1
                      ? [...members, client]
                      : members
                }
              }
            });
            // update graph
            this.setState({
              clusters: {
                ...clusters,
                cluster: {
                  id: cluster,
                  members:
                    members.indexOf(client) === -1
                      ? [...members, client]
                      : members
                }
              }
            });
            console.log("add client", event.log);
            break;
          }
          case LogTypes.Coordinator.RemoveClient: {
            console.log("remove client", event.log);
            // update graph
            break;
          }
          case LogTypes.Coordinator.AddEdge: {
            break;
          }
          case LogTypes.Coordinator.RemoveEdge: {
            break;
          }
          case LogTypes.Sender.Send: {
            // draw data signal
            break;
          }
          case LogTypes.Sender.Ack: {
            // draw ack signal
            // if from peer, draw peer ->   peer -> server signal
            // if from server, draw peer -> server signal
            break;
          }
          case LogTypes.Server.ClientEvent: {
            break;
          }
          default: {
            console.log("UNEXPECTED LOG TYPE", event.log.type);
          }
        }
        break;
      }
      default: {
        console.log("UNEXPECTED DASHBOARD MESSAGES", event);
      }
    }
  }

  handleDisconnect() {
    this.setState({ status: "DISCONNECTED" });
  }

  componentDidUpdate() {
    // draw force graph based on graph data, out of react rendering cycle
  }

  render() {
    const { clusters } = this.state;
    const graphData = getGraphData({ clusters });
    const { width, height } = getViewport();
    return (
      <div className={styles.App}>
        <div></div>
        <ForceGraph
          graphData={graphData}
          backgroundColor="#182a5c"
          showNavInfo={false}
          width={width}
          height={height}
          linkCurvature="curvature"
          linkCurveRotation="rotation"
        />
      </div>
    );
  }
}

export default App;
