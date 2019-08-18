import * as THREE from "three";
import TrackballControls from "three-trackballcontrols";
import ForceGraph from "./force-graph";

export function testGraph(graphData) {
  const N = 10;
  const data = {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
    links: [...Array(N).keys()]
      .filter(id => id)
      .map(id => ({
        source: id,
        target: Math.round(Math.random() * (id - 1))
      }))
  };

  const graph = new ForceGraph()
    .graphData(data)
    .linkCurvature(0.5);
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

  const tbControls = new TrackballControls(camera, renderer.domElement);

  graph.tickFrame();
  // render loop
  (function render() {
    tbControls.update();
    graph.tickFrame();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  })();

  // random particle loop
  (function createParticle() {
    for (var i = 0; i < 10; i++) {
      graph.addParticle({
        linkIndex: Math.floor(Math.random() * (N - 1)),
        duration: 1000 + Math.round(Math.random() * 1000)
      });
    }
    setTimeout(createParticle, Math.round(Math.random() * 1000));
  })();
}
