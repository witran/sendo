// import _get from "lodash.get";
import io from "socket.io-client";
import React, { Component } from "react";
import { ForceGraph3D as ForceGraph } from "react-force-graph";
import { createGraph } from "./force-graph";
import { LogTypes, DashboardMessages } from "./constants";
import { getViewport } from "./utils";
import styles from "./App.css";

const WS_ADDRESS = "localhost:4444";

function getGraphData({ clusters }) {
  const nodes = [{ id: "root", color: "red" }];
  const links = [];
  let linkId = 0;
  Object.values(clusters).forEach(({ members }) => {
    members.forEach(id => {
      nodes.push({ id });
      links.push({
        id: `${id}:root`,
        source: id,
        target: "root",
        distance: 60,
        curvature: 0.05,
        rotation: Math.PI / 2,
        color: "white"
      });
      links.push({
        id: `root:${id}`,
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
          id: `${members[i]}:${members[j]}`,
          source: members[i],
          target: members[j],
          distance: 20,
          curvature: 0.05,
          rotation: Math.PI / 2,
          color: "white"
        });
        links.push({
          id: `${members[j]}:${members[i]}`,
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

function getParticleForTrace(trace) {}

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
      clients: [],

      seedRatio: 1,
      clusterSize: 4,

      status: "INIT"
    };

    this.traces = {};

    window.addEventListener("resize", () => {
      this.forceUpdate();
    });

    const { graph, camera } = createGraph();
    this.graph = graph;
    this.camera = camera;
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
            console.log("add client", event.log);
            const { cluster, client } = event.log;
            const { clusters } = this.state;
            const members = clusters[cluster]
              ? clusters[cluster].members || []
              : [];
            const newMembers =
              members.indexOf(client) === -1 ? [...members, client] : members;
            const newClusters = {
              ...clusters,
              [cluster]: {
                id: cluster,
                members: newMembers
              }
            };
            // update graph
            this.setState({
              clusters: newClusters
            });
            break;
          }
          case LogTypes.Coordinator.RemoveClient: {
            console.log("remove client", event.log);
            // update graph
            const { cluster, client } = event.log;
            const { clusters } = this.state;
            const members = clusters[cluster]
              ? clusters[cluster].members || []
              : [];
            const index = members.indexOf(client);
            const newMembers =
              index > -1
                ? [
                    ...members.slice(0, index),
                    ...members.slice(index + 1, members.length)
                  ]
                : members;

            const newClusters = {
              ...clusters,
              [cluster]: {
                id: cluster,
                members: newMembers
              }
            };

            // remove 1 expected ack count from pending trace buffer
            Object.values(this.traces).forEach(trace => {
              if (trace.cluster.id === cluster) {
                trace.cluster.ackCountExpected = cluster.members.length
              }
            });

            if (!newMembers) {
              delete newClusters[cluster];
            }
            // update graph
            this.setState({
              clusters: newClusters
            });
            break;
          }
          case LogTypes.Coordinator.AddEdge: {
            break;
          }
          case LogTypes.Coordinator.RemoveEdge: {
            break;
          }
          case LogTypes.Sender.Send: {
            // find edge
            const { clusters } = this.state;
            // const { nodes, links } = getGraphData({ clusters });
            const { client, offsets } = event.log;
            const cluster = Object.values(clusters).filter(
              cluster => cluster.members.indexOf(client) > -1
            )[0];

            // TODO: handle case where client leave after message is sent
            offsets.forEach(offset => {
              const traceKey = `${offset}:${cluster.id}`;
              if (!this.traces[traceKey]) {
                this.traces[traceKey] = {
                  cluster: cluster.id,
                  events: [
                    {
                      type: "send",
                      client
                    }
                  ],
                  ackCountExpected: cluster.members.length,
                  ackCount: 0
                };
              } else {
                this.traces[traceKey].events.push({ type: "send", client });
              }
            });
            break;
          }
          case LogTypes.Sender.Ack: {
            const { client, offsets, from } = event.log;
            const { clusters, clusterSize } = this.state;
            const cluster = Object.values(clusters).filter(
              cluster => cluster.members.indexOf(client) > -1
            )[0];

            offsets.forEach(offset => {
              const traceKey = `${offset}:${cluster.id}`;
              const trace = this.traces[traceKey];

              if (!trace) return;

              trace.events.push({
                type: "ack",
                client,
                from
              });
              trace.ackCount++;
              // TODO: handle cases where client joined after message is sent
              if (trace.ackCount === trace.ackCountExpected) {
                this.drawParticleForTrace(trace);
                delete this.traces[offset];
              }
            });

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

  drawParticleForTrace(trace) {
    // draw send
    const sendDelay = 1000 + Math.round(Math.random() * 1000);
    this.graph.addParticle({
      linkId: `root:${trace.events[0].client}`,
      duration: sendDelay,
      color: "red",
      width: 2
    });

    console.log('DRAW PARTICLE FOR TRACE', trace);

    trace.events.forEach((event, index) => {
      if (event.type === "ack" && event.from !== "server") {
        const peerSendDelay = 500 + Math.round(Math.random() * 500);
        setTimeout(() => {
          // draw peer ack
          // -> draw peer send
          // -> schedule draw peer ack
          // draw extra server send if needed
          this.graph.addParticle({
            linkId: `${event.from}:${event.client}`,
            duration: peerSendDelay,
            color: "red",
            width: 2
          });
          const peerAckDelay = 500 + Math.round(Math.random() * 500);
          setTimeout(() => {
            this.graph.addParticle({
              linkId: `${event.client}:root`,
              duration: peerAckDelay,
              width: 1
            });
          }, peerSendDelay);
        }, sendDelay);
      } else if (event.type === "send" && index > 0) {
        const ACK_WINDOW = 3000;
        setTimeout(() => {
          this.graph.addParticle({
            linkId: `root:${trace.events[0].client}`,
            duration: sendDelay,
            color: "red",
            width: 2
          });
        }, ACK_WINDOW);
      }
    });
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

    this.graph.graphData(graphData);
    this.camera.position.z = Math.cbrt(graphData.nodes.length) * 180;
    // const { width, height } = getViewport();
    return (
      <div className={styles.App}>
        <div></div>
        {/*<ForceGraph
          graphData={graphData}
          backgroundColor="#182a5c"
          showNavInfo={false}
          width={width}
          height={height}
          linkCurvature="curvature"
          linkCurveRotation="rotation"
        />*/}
      </div>
    );
  }
}

export default App;
