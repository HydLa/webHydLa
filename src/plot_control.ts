import { PlotLine } from "./plot_line";
import { GraphControl } from "./graph_control";
import { PlotLineMapControl } from "./plot_line_map_control";
import { DOMControl } from "./dom_control";

import * as THREE from 'three';
import { Triplet, RGB, ComparableTriplet, Range } from "./plot_utils";
import { Object3D } from "three";

const axisColorBases = new Triplet<RGB>(
  new RGB(1.0, 0.3, 0.3),
  new RGB(0.3, 1.0, 0.3),
  new RGB(0.3, 0.3, 1.0)
);

export class PlotControl {
  static array = -1;
  static current_line_vec_animation = [];
  static PlotStartTime: number;

  static axisColors = new Triplet<string>("#FF8080", "#80FF80", "#8080FF")
  static prev_ranges: ComparableTriplet<Range>;
  static axisLines: Triplet<THREE.Object3D>;

  static init() {

  }
  static add_plot(line: PlotLine) {
    var axes;
    if (line.settings.x == "" ||
      line.settings.y == "" ||
      line.settings.z == "") {
      return;
    }
    try {
      axes = {
        x: Construct.parse(line.settings.x),
        y: Construct.parse(line.settings.y),
        z: Construct.parse(line.settings.z)
      };
      line.updateFolder(true);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      line.updateFolder(false);
      return;
    }
    var dt = plot_settings.plotInterval;
    var phase = current_hydat.first_phases[0];
    var parameter_condition_list = divideParameter(current_hydat.parameters);
    var color = getColors(parameter_condition_list.length, line.color_angle);
    line.plot_information = { phase_index_array: [{ phase: phase, index: 0 }], axes: axes, line: line, width: plot_settings.lineWidth, color: color, dt: dt, parameter_condition_list: parameter_condition_list };
    startPreloader();
    PlotControl.array = -1;
    animation_line = [];
    animation_line.maxlen = 0;
    if (line.plot_ready == undefined) requestAnimationFrame(function () { line.plotReady() });
  }
  static add_plot_each(phase_index_array, axes, line: PlotLine, width, color, dt, parameter_condition_list, current_param_idx, current_line_vec) {
    try {
      while (true) {
        if (line.plot_ready) {
          line.plotting = false;
          console.log("Plot is interrupted");
          PlotControl.PlotStartTime = undefined;
          return;
        }

        // phase_index_array is used to implement dfs without function call.
        let phase_index = phase_index_array[phase_index_array.length - 1];
        let phase = phase_index.phase;
        let vec = phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, dt);
        current_line_vec = current_line_vec.concat(vec);
        let vec_animation = phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, 0.01);
        PlotControl.current_line_vec_animation = PlotControl.current_line_vec_animation.concat(vec_animation);
        if (phase.children.length == 0) {
          PlotControl.array += 1;
          // on leaves

          var cylindersGeometry = new THREE.Geometry();
          let scaledWidth = 0.5 * width / graph.camera.zoom;
          var addCylinder = function (startPos: THREE.Vector3, endPos: THREE.Vector3) {
            let directionVec = endPos.clone().sub(startPos);
            const height = directionVec.length();
            directionVec.normalize();
            let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(scaledWidth, scaledWidth, height + scaledWidth, 8, 1));

            const upVec = new THREE.Vector3(0, 1, 0);
            const rotationAxis = upVec.clone().cross(directionVec).normalize();
            const rotationAngle = Math.acos(upVec.dot(directionVec));

            const newpos = startPos.clone().lerp(endPos, 0.5);
            cylinderMesh.position.set(newpos.x, newpos.y, newpos.z);
            cylinderMesh.setRotationFromAxisAngle(rotationAxis, rotationAngle);

            cylinderMesh.updateMatrix();
            const geometry = cylinderMesh.geometry instanceof THREE.Geometry ? cylinderMesh.geometry : new THREE.Geometry().fromBufferGeometry(cylinderMesh.geometry);
            cylindersGeometry.merge(geometry, cylinderMesh.matrix);
          };

          const dottedLength = 10.0 / graph.camera.zoom;
          for (var i = 0; i + 1 < current_line_vec.length; i++) {
            if ('isPP' in current_line_vec[i + 1]) {
              const posBegin = current_line_vec[i];
              const posEnd = current_line_vec[i + 1];
              let directionVec = posEnd.clone().sub(posBegin);
              const lineLength = directionVec.length();
              directionVec.normalize();
              const numOfDots = lineLength / dottedLength;
              for (var j = 1; j + 1 < numOfDots; j += 2) {
                addCylinder(
                  posBegin.clone().add(directionVec.clone().multiplyScalar(j * dottedLength)),
                  posBegin.clone().add(directionVec.clone().multiplyScalar((j + 1) * dottedLength))
                );
              }
            }
            else if (!current_line_vec[i].equals(current_line_vec[i + 1])) {
              addCylinder(current_line_vec[i], current_line_vec[i + 1]);
            }
          }

          let three_line = new THREE.Mesh(
            cylindersGeometry,
            new THREE.MeshBasicMaterial({ color: color[current_param_idx] })
          );
          three_line.isLine = true;
          graph.scene.add(three_line);
          line.plot.push(three_line);

          animation_line[PlotControl.array] = (PlotControl.current_line_vec_animation);
          animation_line[PlotControl.array].color = (color[current_param_idx]);
          if (animation_line.maxlen < PlotControl.current_line_vec_animation.length) {
            animation_line.maxlen = PlotControl.current_line_vec_animation.length;
          }
          let s_geometry = new THREE.SphereGeometry(0.1);
          let s_material = new THREE.MeshBasicMaterial({ color: color[current_param_idx] });
          let sphere = new THREE.Mesh(s_geometry, s_material);
          sphere.position.set(0, 0, 0);
          GraphControl.scene.add(sphere);
          plot_animate[PlotControl.array] = (sphere);
          current_line_vec = [];
          PlotControl.current_line_vec_animation = [];
          phase_index_array.pop();
          phase_index = phase_index_array[phase_index_array.length - 1];
          ++(phase_index.index);
          phase = phase_index.phase;
          if (animation_line.length > 4) {
            console.log("a");
          }
        }
        while (true) {
          var to_next_child = false;
          // search next child to plot
          for (; phase_index.index < phase.children.length; phase_index.index++) {
            var child = phase.children[phase_index.index];
            var included_by_parameter_condition = check_parameter_condition(child.parameter_maps, parameter_condition_list[current_param_idx]);
            if (included_by_parameter_condition) {
              phase_index_array.push({ phase: child, index: 0 });
              var current_time = new Date().getTime();
              if (current_time - line.last_plot_time >= 200) {
                line.last_plot_time = current_time;
                // use setTimeout to check event queue
                requestAnimationFrame(function () {
                  PlotControl.add_plot_each(phase_index_array, axes, line, width, color, dt, parameter_condition_list, current_param_idx, current_line_vec)
                });
                return;
              }
              else to_next_child = true;
              break;
            }
          }
          if (to_next_child) break;


          // Plot for this current_param_idx is completed.
          if (phase_index_array.length == 1) {
            ++current_param_idx;
            if (current_param_idx >= parameter_condition_list.length) {
              // Plot is completed.
              line.plotting = false;
              PlotControl.checkAndStopPreloader();
              return;
            }
            else {
              // setTimeout(function()
              //             {add_plot_each([{phase:phase_index_array[0].phase, index:0}], axes, line, width, color, dt, parameter_condition_list, current_param_idx, [])
              //             }, 0);
              phase_index_array[0].index = 0;
              break;
            }
          } else {
            // go to parent phase
            phase_index_array.pop();
            phase_index = phase_index_array[phase_index_array.length - 1];
            ++(phase_index.index);
            phase = phase_index.phase;
          }
        }
      }
    }
    catch (ex) {
      console.log(ex);
      console.log(ex.stack);
      DOMControl.showToast("Plot failed: " + ex.name +
        "(" + ex.message + ")", 3000, "red darken-4");
      line.plotting = false;
      PlotControl.checkAndStopPreloader();
    }
  }
  static checkAndStopPreloader() {
    // var table = document.getElementById("graph_axis_table");
    if (!PlotLineMapControl.isAllReady()) return;
    var current_time = new Date().getTime();
    if (PlotControl.PlotStartTime === undefined || current_time - PlotControl.PlotStartTime >= 1000) {
      DOMControl.showToast("Plot finished.", 1000, "blue");
    }
    PlotControl.PlotStartTime = undefined;
    GraphControl.renderer.render(GraphControl.scene, GraphControl.camera);
    stopPreloader();
  }
  static update_axes(force: boolean) {
    var ranges = getRangesOfFrustum(GraphControl.camera);
    if (force === true || PlotControl.prev_ranges === undefined || !ranges.equals(PlotControl.prev_ranges)) {
      var margin_rate = 1.1;

      var max_interval_px = 200; // 50 px
      const min_visible_ticks = Math.floor(Math.max(GraphControl.elem.clientWidth, GraphControl.elem.clientHeight) / max_interval_px);
      const min_visible_range = Math.min(ranges.x.getInterval(), ranges.y.getInterval(), ranges.z.getInterval());
      var max_interval = min_visible_range / min_visible_ticks;

      if (PlotControl.axisLines !== undefined) {
        GraphControl.scene.remove(PlotControl.axisLines.x);
        GraphControl.scene.remove(PlotControl.axisLines.y);
        GraphControl.scene.remove(PlotControl.axisLines.z);
      }
      var interval = Math.pow(10, Math.floor(Math.log(max_interval) / Math.log(10)));
      interval = 1;
      PlotControl.axisLines = new Triplet<Object3D>(
        PlotControl.makeAxis(ranges.x, interval, new THREE.Color(PlotControl.axisColors.x)),
        PlotControl.makeAxis(ranges.y, interval, new THREE.Color(PlotControl.axisColors.y)),
        PlotControl.makeAxis(ranges.z, interval, new THREE.Color(PlotControl.axisColors.z))
      );;
      ;
      PlotControl.axisLines.x.rotation.set(0, Math.PI / 2, Math.PI / 2);
      PlotControl.axisLines.y.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
      GraphControl.scene.add(PlotControl.axisLines.x);
      GraphControl.scene.add(PlotControl.axisLines.y);
      GraphControl.scene.add(PlotControl.axisLines.z);
      GraphControl.render_three_js();
    }
    updateAxisScaleLabel(ranges);
    PlotControl.prev_ranges = ranges;
  }
  static makeAxis(range: Range, delta: number, color: THREE.Color) {
    var geometry = new THREE.Geometry();
    var material = new THREE.LineBasicMaterial({ vertexColors: true })
    // var i;
    // var start = Math.floor(range.min / delta) * delta;
    // var end = range.max;
    // for(i=start; i<=end; i+=delta){
    //   geometry.vertices.push(new THREE.Vector3(-1,0,i), new THREE.Vector3(1,0,i));
    //   geometry.colors.push(color,color);
    // }
    geometry.vertices.push(new THREE.Vector3(0, 0, range.min), new THREE.Vector3(0, 0, range.max));
    geometry.colors.push(color, color);
    var grid_obj = new THREE.Object3D();
    grid_obj.add(new THREE.LineSegments(geometry, material));
    return grid_obj;
  }

  static setBackgroundColor(color:THREE.Color) {
    var color_val = parseInt("0x" + color.substr(1));
    var b = color_val % 256;
    color_val /= 256;
    var g = color_val % 256;
    color_val /= 256;
    var r = color_val;
    var brightness = Math.min(255, 256 - Math.max(r, g, b));
    this.axisColors = calculateColorsWithBrightness(axisColorBases, brightness);
    GraphControl.renderer.setClearColor(color);
    PlotControl.update_axes(true);
  }
}
