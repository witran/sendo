import {
  Mesh,
  MeshLambertMaterial,
  BufferGeometry,
  BufferAttribute,
  Matrix4,
  Vector3,
  SphereBufferGeometry,
  CylinderBufferGeometry,
  ConeBufferGeometry,
  Line,
  LineBasicMaterial,
  QuadraticBezierCurve3,
  CubicBezierCurve3,
  Group
} from "three";

import {
  forceSimulation as d3ForceSimulation,
  forceLink as d3ForceLink,
  forceManyBody as d3ForceManyBody,
  forceCenter as d3ForceCenter
  // forceRadial as d3ForceRadial
} from "./engine";

import createClass from "./utils/create-class";
import accessorFn from "./utils/accessor-fn";
import { autoColorObjects, colorStr2Hex, colorAlpha } from "./utils/colors";

// const DAG_LEVEL_NODE_RATIO = 2;

const three = window.THREE
  ? window.THREE // Prefer consumption from global THREE, if exists
  : {
      Mesh,
      MeshLambertMaterial,
      BufferGeometry,
      BufferAttribute,
      Matrix4,
      Vector3,
      SphereBufferGeometry,
      CylinderBufferGeometry,
      ConeBufferGeometry,
      Line,
      LineBasicMaterial,
      QuadraticBezierCurve3,
      CubicBezierCurve3,
      Group
    };

const ForceGraph = createClass({
  props: {
    graphData: {
      default: {
        nodes: [],
        links: []
      },
      onChange(graphData, state) {
        if (graphData.nodes.length || graphData.links.length) {
          console.info(
            "force-graph loading",
            graphData.nodes.length + " nodes",
            graphData.links.length + " links"
          );
        }

        state.engineRunning = false; // Pause simulation immediately
        state.sceneNeedsRepopulating = true;
        state.simulationNeedsReheating = true;
      }
    },
    numDimensions: {
      default: 3
      // REMOVE THIS
      // onChange(numDim, state) {
      //   state.simulationNeedsReheating = true;

      //   const chargeForce = state.d3ForceLayout.force('charge');
      //   // Increase repulsion on 3D mode for improved spatial separation
      //   if (chargeForce) { chargeForce.strength(numDim > 2 ? -60 : -30) }

      //   if (numDim < 3) { eraseDimension(state.graphData.nodes, 'z'); }
      //   if (numDim < 2) { eraseDimension(state.graphData.nodes, 'y'); }

      //   function eraseDimension(nodes, dim) {
      //     nodes.forEach(d => {
      //       delete d[dim];     // position
      //       delete d[`v${dim}`]; // velocity
      //     });
      //   }
      // }
    },

    // dagMode: { onChange(dagMode, state) { // td, bu, lr, rl, zin, zout, radialin, radialout
    //   !dagMode && state.forceEngine === 'd3' && (state.graphData.nodes || []).forEach(n => n.fx = n.fy = n.fz = undefined); // unfix nodes when disabling dag mode
    //   state.simulationNeedsReheating = true;
    // }},
    // dagLevelDistance: { onChange(_, state) { state.simulationNeedsReheating = true } },

    nodeRelSize: {
      default: 4,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    }, // volume per val unit
    nodeId: {
      default: "id",
      onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    nodeVal: {
      default: "val",
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeResolution: {
      default: 8,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    }, // how many slice segments in the sphere's circumference
    nodeColor: {
      default: "color",
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeAutoColorBy: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeOpacity: {
      default: 0.75,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeVisibility: {
      default: true,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeThreeObject: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeThreeObjectExtend: {
      default: false,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },

    linkSource: {
      default: "source",
      onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    linkTarget: {
      default: "target",
      onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    linkVisibility: {
      default: true,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkColor: {
      default: "color",
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkAutoColorBy: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkOpacity: {
      default: 0.2,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkWidth: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    }, // Rounded to nearest decimal. For falsy values use dimensionless line with 1px regardless of distance.
    linkResolution: {
      default: 6,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    }, // how many radial segments in each line tube's geometry
    linkCurvature: { default: 0, triggerUpdate: false }, // line curvature radius (0: straight, 1: semi-circle)
    linkCurveRotation: { default: 0, triggerUpdate: false }, // line curve rotation along the line axis (0: interection with XY plane, PI: upside down)
    linkMaterial: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkThreeObject: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkThreeObjectExtend: {
      default: false,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkPositionUpdate: { triggerUpdate: false }, // custom function to call for updating the link's position. Signature: (threeObj, { start: { x, y, z},  end: { x, y, z }}, link). If the function returns a truthy value, the regular link position update will not run.

    particleWidth: {
      default: 1,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    particleColor: {
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    particleResolution: {
      default: 4,
      onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    }, // how many slice segments in the particle sphere's circumference

    forceEngine: {
      default: "d3",
      onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    }, // d3 or ngraph
    d3AlphaDecay: {
      default: 0.0228,
      triggerUpdate: false,
      onChange(alphaDecay, state) {
        state.d3ForceLayout.alphaDecay(alphaDecay);
      }
    },
    d3AlphaTarget: {
      default: 0,
      triggerUpdate: false,
      onChange(alphaTarget, state) {
        state.d3ForceLayout.alphaTarget(alphaTarget);
      }
    },
    d3VelocityDecay: {
      default: 0.4,
      triggerUpdate: false,
      onChange(velocityDecay, state) {
        state.d3ForceLayout.velocityDecay(velocityDecay);
      }
    },
    warmupTicks: { default: 0, triggerUpdate: false }, // how many times to tick the force engine at init before starting to render
    cooldownTicks: { default: Infinity, triggerUpdate: false },
    cooldownTime: { default: 15000, triggerUpdate: false }, // ms

    onLoading: { default: () => {}, triggerUpdate: false },
    onFinishLoading: { default: () => {}, triggerUpdate: false },
    onEngineTick: { default: () => {}, triggerUpdate: false },
    onEngineStop: { default: () => {}, triggerUpdate: false }
  },

  methods: {
    addParticle: function(state, { linkIndex, duration }) {
      state.particles.push({ linkIndex, duration, startTime: Date.now() });
      state.sceneNeedsRepopulating = true;
      state.update();
      return this;
    },
    refresh: function(state) {
      state.sceneNeedsRepopulating = true;
      state.simulationNeedsReheating = true;
      state.update();
      return this;
    },
    // Expose d3 forces for external manipulation
    d3Force: function(state, forceName, forceFn) {
      if (forceFn === undefined) {
        return state.d3ForceLayout.force(forceName); // Force getter
      }
      state.d3ForceLayout.force(forceName, forceFn); // Force setter
      return this;
    },
    _updateScene: function(state) {},
    // reset cooldown state
    resetCountdown: function(state) {
      state.cntTicks = 0;
      state.startTickTime = new Date();
      state.engineRunning = true;
      return this;
    },

    tickFrame: function(state) {
      if (state.engineRunning) {
        layoutTick();
      }

      updateParticles();

      return this;

      function layoutTick() {
        if (
          ++state.cntTicks > state.cooldownTicks ||
          new Date() - state.startTickTime > state.cooldownTime
        ) {
          state.engineRunning = false; // Stop ticking graph
          state.onEngineStop();
        } else {
          state.layout.tick(); // Tick it
          state.onEngineTick();
        }

        // Update nodes position
        state.graphData.nodes.forEach(node => {
          const obj = node.__threeObj;
          if (!obj) return;

          obj.position.x = node.x;
          obj.position.y = node.y || 0;
          obj.position.z = node.z || 0;
        });

        // Update links position
        const linkCurvatureAccessor = accessorFn(state.linkCurvature);
        const linkCurveRotationAccessor = accessorFn(state.linkCurveRotation);
        const linkThreeObjectExtendAccessor = accessorFn(
          state.linkThreeObjectExtend
        );

        state.graphData.links.forEach(link => {
          const line = link.__lineObj;
          if (!line) return;

          const start = link.source;
          const end = link.target;

          if (!start.hasOwnProperty("x") || !end.hasOwnProperty("x")) return; // skip invalid link

          calcLinkCurve(link); // calculate link curve for all links, including custom replaced, so it can be used in directional functionality

          const extendedObj = linkThreeObjectExtendAccessor(link);
          if (
            state.linkPositionUpdate &&
            state.linkPositionUpdate(
              extendedObj ? line.children[0] : line, // pass child custom object if extending the default
              {
                start: { x: start.x, y: start.y, z: start.z },
                end: { x: end.x, y: end.y, z: end.z }
              },
              link
            ) &&
            !extendedObj
          ) {
            // exit if successfully custom updated position of non-extended obj
            return;
          }

          if (line.type === "Line") {
            // Update line geometry
            const curveResolution = 30; // # line segments
            const curve = link.__curve;

            if (!curve) {
              // straight line
              let linePos = line.geometry.getAttribute("position");
              if (!linePos || !linePos.array || linePos.array.length !== 6) {
                line.geometry.addAttribute(
                  "position",
                  (linePos = new three.BufferAttribute(
                    new Float32Array(2 * 3),
                    3
                  ))
                );
              }

              linePos.array[0] = start.x;
              linePos.array[1] = start.y || 0;
              linePos.array[2] = start.z || 0;
              linePos.array[3] = end.x;
              linePos.array[4] = end.y || 0;
              linePos.array[5] = end.z || 0;

              linePos.needsUpdate = true;
            } else {
              // bezier curve line
              line.geometry.setFromPoints(curve.getPoints(curveResolution));
            }
            line.geometry.computeBoundingSphere();
          } else if (line.type === "Mesh") {
            // Update cylinder geometry
            // links with width ignore linkCurvature because TubeGeometries can't be updated
            link.__curve = null; // force reset link curve

            const vStart = new three.Vector3(
              start.x,
              start.y || 0,
              start.z || 0
            );
            const vEnd = new three.Vector3(end.x, end.y || 0, end.z || 0);
            const distance = vStart.distanceTo(vEnd);

            line.position.x = vStart.x;
            line.position.y = vStart.y;
            line.position.z = vStart.z;

            line.scale.z = distance;

            line.parent.localToWorld(vEnd); // lookAt requires world coords
            line.lookAt(vEnd);
          }
        });

        function calcLinkCurve(link) {
          const start = link.source;
          const end = link.target;

          if (!start.hasOwnProperty("x") || !end.hasOwnProperty("x")) return; // skip invalid link

          const curvature = linkCurvatureAccessor(link);

          if (!curvature) {
            link.__curve = null; // Straight line
          } else {
            // bezier curve line (only for line types)
            const vStart = new three.Vector3(
              start.x,
              start.y || 0,
              start.z || 0
            );
            const vEnd = new three.Vector3(end.x, end.y || 0, end.z || 0);

            const l = vStart.distanceTo(vEnd); // line length

            let curve;
            const curveRotation = linkCurveRotationAccessor(link);

            if (l > 0) {
              const dx = end.x - start.x;
              const dy = end.y - start.y || 0;

              const vLine = new three.Vector3().subVectors(vEnd, vStart);

              const cp = vLine
                .clone()
                .multiplyScalar(curvature)
                .cross(
                  dx !== 0 || dy !== 0
                    ? new three.Vector3(0, 0, 1)
                    : new three.Vector3(0, 1, 0)
                ) // avoid cross-product of parallel vectors (prefer Z, fallback to Y)
                .applyAxisAngle(vLine.normalize(), curveRotation) // rotate along line axis according to linkCurveRotation
                .add(
                  new three.Vector3().addVectors(vStart, vEnd).divideScalar(2)
                );

              curve = new three.QuadraticBezierCurve3(vStart, cp, vEnd);
            } else {
              // Same point, draw a loop
              const d = curvature * 70;
              const endAngle = -curveRotation; // Rotate clockwise (from Z angle perspective)
              const startAngle = endAngle + Math.PI / 2;

              curve = new three.CubicBezierCurve3(
                vStart,
                new three.Vector3(
                  d * Math.cos(startAngle),
                  d * Math.sin(startAngle),
                  0
                ).add(vStart),
                new three.Vector3(
                  d * Math.cos(endAngle),
                  d * Math.sin(endAngle),
                  0
                ).add(vStart),
                vEnd
              );
            }

            link.__curve = curve;
          }
        }
      }

      function updateParticles() {
        const now = Date.now();

        // bad side-effect
        state.particles
          .filter(({ duration, startTime }) => now - startTime >= duration)
          .forEach(
            particle =>
              particle.__particleObj && particle.__particleObj.__dispose()
          );

        state.particles = state.particles.filter(
          ({ duration, startTime }) => now - startTime < duration
        );

        state.particles.forEach(particle => {
          const particleObj = particle.__particleObj;

          if (!particleObj) return;

          const { linkIndex, duration, startTime } = particle;
          const link = state.graphData.links[linkIndex];
          const { source, target } = link;

          if (!source.hasOwnProperty("x") || !target.hasOwnProperty("x"))
            return; // skip invalid link

          const getPosition = link.__curve
            ? t => link.__curve.getPoint(t) // interpolate along bezier curve
            : t => {
                // straight line: interpolate linearly
                const iplt = (dim, source, target, t) =>
                  source[dim] + (target[dim] - source[dim]) * t || 0;
                return {
                  x: iplt("x", source, target, t),
                  y: iplt("y", source, target, t),
                  z: iplt("z", source, target, t)
                };
              };

          const ratio = (now - startTime) / duration;
          particleObj.__progressRatio = ratio; // debug logging

          const pos = getPosition(ratio);
          ["x", "y", "z"].forEach(
            dim => (particleObj.position[dim] = pos[dim])
          );
        });
      }
    }
  },

  stateInit: () => ({
    d3ForceLayout: d3ForceSimulation()
      .force("link", d3ForceLink())
      .force("charge", d3ForceManyBody())
      .force("center", d3ForceCenter())
      .force("dagRadial", null)
      .stop(),
    engineRunning: false,
    sceneNeedsRepopulating: true,
    simulationNeedsReheating: true,
    particles: []
  }),

  init(threeObj, state) {
    // Main three object to manipulate
    state.graphScene = threeObj;
  },

  update(state) {
    state.engineRunning = false; // pause simulation

    if (state.sceneNeedsRepopulating) {
      state.sceneNeedsRepopulating = false;

      if (state.nodeAutoColorBy !== null) {
        // Auto add color to uncolored nodes
        autoColorObjects(
          state.graphData.nodes,
          accessorFn(state.nodeAutoColorBy),
          state.nodeColor
        );
      }
      if (state.linkAutoColorBy !== null) {
        // Auto add color to uncolored links
        autoColorObjects(
          state.graphData.links,
          accessorFn(state.linkAutoColorBy),
          state.linkColor
        );
      }

      // Clear the scene
      const materialDispose = material => {
        if (material instanceof Array) {
          material.forEach(materialDispose);
        } else {
          if (material.map) {
            material.map.dispose();
          }
          material.dispose();
        }
      };
      const deallocate = obj => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          materialDispose(obj.material);
        }
        if (obj.texture) {
          obj.texture.dispose();
        }
        if (obj.children) {
          obj.children.forEach(deallocate);
        }
      };
      while (state.graphScene.children.length) {
        const obj = state.graphScene.children[0];
        state.graphScene.remove(obj);
        deallocate(obj);
      }

      // Add WebGL objects
      const customNodeObjectAccessor = accessorFn(state.nodeThreeObject);
      const customNodeObjectExtendAccessor = accessorFn(
        state.nodeThreeObjectExtend
      );
      const valAccessor = accessorFn(state.nodeVal);
      const colorAccessor = accessorFn(state.nodeColor);
      const visibilityAccessor = accessorFn(state.nodeVisibility);
      const sphereGeometries = {}; // indexed by node value
      const sphereMaterials = {}; // indexed by color
      state.graphData.nodes.forEach(node => {
        if (!visibilityAccessor(node)) {
          // Exclude non-visible nodes
          node.__threeObj = null;
          return;
        }

        let customObj = customNodeObjectAccessor(node);
        const extendObj = customNodeObjectExtendAccessor(node);

        if (customObj && state.nodeThreeObject === customObj) {
          // clone object if it's a shared object among all nodes
          customObj = customObj.clone();
        }

        let obj;
        if (customObj && !extendObj) {
          obj = customObj;
        } else {
          // Add default object (sphere mesh)
          const val = valAccessor(node) || 1;
          if (!sphereGeometries.hasOwnProperty(val)) {
            sphereGeometries[val] = new three.SphereBufferGeometry(
              Math.cbrt(val) * state.nodeRelSize,
              state.nodeResolution,
              state.nodeResolution
            );
          }

          const color = colorAccessor(node);
          if (!sphereMaterials.hasOwnProperty(color)) {
            sphereMaterials[color] = new three.MeshLambertMaterial({
              color: colorStr2Hex(color || "#ffffaa"),
              transparent: true,
              opacity: state.nodeOpacity * colorAlpha(color)
            });
          }

          obj = new three.Mesh(sphereGeometries[val], sphereMaterials[color]);

          if (customObj && extendObj) {
            obj.add(customObj); // extend default with custom
          }
        }

        obj.__graphObjType = "node"; // Add object type
        obj.__data = node; // Attach node data

        state.graphScene.add((node.__threeObj = obj));
      });

      const customLinkObjectAccessor = accessorFn(state.linkThreeObject);
      const customLinkObjectExtendAccessor = accessorFn(
        state.linkThreeObjectExtend
      );
      const customLinkMaterialAccessor = accessorFn(state.linkMaterial);
      const linkVisibilityAccessor = accessorFn(state.linkVisibility);
      const linkColorAccessor = accessorFn(state.linkColor);
      const linkWidthAccessor = accessorFn(state.linkWidth);

      const lineMaterials = {}; // indexed by link color
      const cylinderGeometries = {}; // indexed by link width
      state.graphData.links.forEach(link => {
        if (!linkVisibilityAccessor(link)) {
          // Exclude non-visible links
          link.__lineObj = link.__arrowObj = link.__photonObjs = null;
          return;
        }

        const color = linkColorAccessor(link);

        let customObj = customLinkObjectAccessor(link);
        const extendObj = customLinkObjectExtendAccessor(link);

        if (customObj && state.linkThreeObject === customObj) {
          // clone object if it's a shared object among all links
          customObj = customObj.clone();
        }

        let lineObj;
        if (customObj && !extendObj) {
          lineObj = customObj;
        } else {
          // Add default line object
          const linkWidth = Math.ceil(linkWidthAccessor(link) * 10) / 10;

          const useCylinder = !!linkWidth;

          let geometry;
          if (useCylinder) {
            if (!cylinderGeometries.hasOwnProperty(linkWidth)) {
              const r = linkWidth / 2;
              geometry = new three.CylinderBufferGeometry(
                r,
                r,
                1,
                state.linkResolution,
                1,
                false
              );
              geometry.applyMatrix(
                new three.Matrix4().makeTranslation(0, 1 / 2, 0)
              );
              geometry.applyMatrix(
                new three.Matrix4().makeRotationX(Math.PI / 2)
              );
              cylinderGeometries[linkWidth] = geometry;
            }
            geometry = cylinderGeometries[linkWidth];
          } else {
            // Use plain line (constant width)
            geometry = new three.BufferGeometry();
            geometry.addAttribute(
              "position",
              new three.BufferAttribute(new Float32Array(2 * 3), 3)
            );
          }

          let lineMaterial = customLinkMaterialAccessor(link);
          if (!lineMaterial) {
            if (!lineMaterials.hasOwnProperty(color)) {
              const lineOpacity = state.linkOpacity * colorAlpha(color);
              lineMaterials[color] = new three.MeshLambertMaterial({
                color: colorStr2Hex(color || "#f0f0f0"),
                transparent: lineOpacity < 1,
                opacity: lineOpacity,
                depthWrite: lineOpacity >= 1 // Prevent transparency issues
              });
            }
            lineMaterial = lineMaterials[color];
          }

          lineObj = new three[useCylinder ? "Mesh" : "Line"](
            geometry,
            lineMaterial
          );

          if (customObj && extendObj) {
            lineObj.add(customObj); // extend default with custom
          }
        }

        lineObj.renderOrder = 10; // Prevent visual glitches of dark lines on top of nodes by rendering them last

        lineObj.__graphObjType = "link"; // Add object type
        lineObj.__data = link; // Attach link data

        state.graphScene.add((link.__lineObj = lineObj));
      });

      const particleWidthAccessor = accessorFn(state.particleWidth);
      const particleColorAccessor = accessorFn(state.particleColor);
      const particleMaterials = {}; // indexed by link color
      const particleGeometries = {}; // indexed by particle width
      // add particles
      console.log("ADD PARTICLES");
      state.particles.forEach(particle => {
        console.log("DRAW PARTICLE", particle);
        const link = state.graphData.links[particle.linkIndex];
        const photonR =
          Math.ceil((particleWidthAccessor(particle) || 4) * 10) / 10 / 2;
        const photonColor =
          particleColorAccessor(particle) ||
          linkColorAccessor(link) ||
          "#f0f0f0";

        if (!particleGeometries.hasOwnProperty(photonR)) {
          particleGeometries[photonR] = new three.SphereBufferGeometry(
            photonR,
            state.particleResolution,
            state.particleResolution
          );
        }
        const particleGeometry = particleGeometries[photonR];

        if (!particleMaterials.hasOwnProperty(photonColor)) {
          particleMaterials[photonColor] = new three.MeshLambertMaterial({
            color: colorStr2Hex(photonColor),
            transparent: true,
            opacity: state.linkOpacity * 3
          });
        }
        const particleMaterial = particleMaterials[photonColor];

        const particleObj = new three.Mesh(particleGeometry, particleMaterial);
        state.graphScene.add(particleObj);
        particle.__particleObj = particleObj;
        particleObj.__data = particle;
        particleObj.__dispose = function() {
          state.graphScene.remove(particleObj);
          deallocate(particleObj);
        };
      });
    }

    if (state.simulationNeedsReheating) {
      state.simulationNeedsReheating = false;
      state.engineRunning = false; // Pause simulation

      // parse links
      state.graphData.links.forEach(link => {
        link.source = link[state.linkSource];
        link.target = link[state.linkTarget];
      });

      // Feed data to force-directed layout
      let layout;
      // D3-force
      (layout = state.d3ForceLayout)
        .stop()
        .alpha(1) // re-heat the simulation
        .numDimensions(state.numDimensions)
        .nodes(state.graphData.nodes);

      // add links (if link force is still active)
      const linkForce = state.d3ForceLayout.force("link");
      if (linkForce) {
        linkForce.id(d => d[state.nodeId]).links(state.graphData.links);
      }

      for (let i = 0; i < state.warmupTicks; i++) {
        layout.tick();
      } // Initial ticks before starting to render

      state.layout = layout;
      this.resetCountdown();

      state.onFinishLoading();
    }

    state.engineRunning = true; // resume simulation
  }
});

class ThreeForceGraph extends Group {
  constructor() {
    super(arguments);
    this.__forceGraph = ForceGraph()(this, ...arguments);
  }
}

Object.keys(ForceGraph()).forEach(
  method =>
    (ThreeForceGraph.prototype[method] = function() {
      const returnVal = this.__forceGraph[method](...arguments);

      return returnVal === this.__forceGraph
        ? this // chain based on this class, not the kapsule obj
        : returnVal;
    })
);

export default ThreeForceGraph;
