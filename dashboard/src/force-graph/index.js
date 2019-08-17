import ForceGraph from "./force-graph";
import * as THREE from "three";

export function testGraph(graphData) {
  const N = 300;
  const data = {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
    links: [...Array(N).keys()]
      .filter(id => id)
      .map(id => ({
        source: id,
        target: Math.round(Math.random() * (id - 1))
      }))
  };
  const graph = new ForceGraph().graphData(data);
  console.log(graph);

  // scene graph, objects
  const scene = new THREE.Scene();
  scene.add(graph);
  scene.add(new THREE.AmbientLight(0xbbbbbb));

  // renderer, attaching dom
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("3d-graph").appendChild(renderer.domElement);

  //camera
  const camera = new THREE.PerspectiveCamera();
  camera.far = 1e5;
  camera.aspect = window.innerWidth / window.innerHeight;
  // ??
  camera.updateProjectionMatrix();
  // camera.lookAt(graph.position);
  camera.position.z = Math.cbrt(N) * 180;

  // render loop
  (function render() {
    graph.tickFrame();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  })();
}
