import * as THREE from "three";
import TrackballControls from "three-trackballcontrols";
import { parseToRgb, opacify } from 'polished';
import ForceGraph from "./force-graph";

export function createGraph() {
  const graph = new ForceGraph()
    .linkCurvature("curvature")
    .linkCurveRotation("rotation")
    .particleColor("color")
    .particleWidth("width");

  // scene graph, objects
  const scene = new THREE.Scene();
  scene.add(graph);
  scene.add(new THREE.AmbientLight(0xbbbbbb));
  scene.add(new THREE.DirectionalLight(0xaaa, 0.6));

  // renderer, attaching dom
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // const backgroundColor = "#182a5c";
  const backgroundColor = "#111";
  let bckgAlpha = parseToRgb(backgroundColor).alpha;
  if (bckgAlpha === undefined) bckgAlpha = 1;
  renderer.setClearColor(new THREE.Color(opacify(1, backgroundColor)), bckgAlpha);

  document.getElementById("3d-graph").appendChild(renderer.domElement);

  //camera
  const camera = new THREE.PerspectiveCamera();
  camera.far = 1e5;
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  const tbControls = new TrackballControls(camera, renderer.domElement);

  graph.tickFrame();
  // render loop
  (function render() {
    tbControls.update();
    graph.tickFrame();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  })();

  return { graph, camera };
}
