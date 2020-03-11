import { PlotLineMapControl } from "./plot_line_map_control";
import { GraphControl } from "./graph_control";

function modifyNameLabel(name) {
  var text = "";
  if (!(name == undefined || name == null)) {
    text = name;
  }
  var canvas = document.getElementById('nameLabelCanvas');
  if (!canvas || !canvas.getContext) {
    return false;
  }
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px 'Arial'";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, 0, canvas.height - 50);
}

var plotting_mode_switch = document.getElementById("plotting-mode-switch");


var plot_animate = [];

// function replot(line) {
//   remove_plot(line);
//   remove_mesh(plot_animate);
//   add_plot(line);
//   if (line.settings.x != "" && line.settings.y != "" && line.settings.z != "") {
//     if (line.remain == undefined) {
//       settingsForCurrentHydat.plot_line_settings[line.index] = line.settings;
//       browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
//     }
//   }
// }


var animation_line = [];



function divideParameter(parameter_map) {

  var now_parameter_condition_list = [{}];

  for (let parameter_name in parameter_map) {
    var setting = plot_settings.parameter_condition[parameter_name];
    if (setting.fixed) {
      for (var i = 0; i < now_parameter_condition_list.length; i++) {
        var parameter_value = setting.value;
        now_parameter_condition_list[i][parameter_name] = new Constant(parameter_value);
      }
    } else {
      var lb = setting.min_value;
      var ub = setting.max_value;
      var div = Math.floor(setting.value);
      var next_parameter_condition_list = [];
      var deltaP;
      if (div == 1) { deltaP = ub - lb; }
      else { deltaP = (ub - lb) / (div - 1); }
      for (var i = 0; i < now_parameter_condition_list.length; i++) {
        for (var j = 0; j < div; j++) {
          var parameter_value = lb + j * deltaP;
          let tmp_obj = $.extend(true, {}, now_parameter_condition_list[i]);  // deep copy
          tmp_obj[parameter_name] = new Constant(parameter_value);
          next_parameter_condition_list.push(tmp_obj);
        }
      }
      now_parameter_condition_list = next_parameter_condition_list;
    }
  }
  return now_parameter_condition_list;
}

function getColors(colorNum, colorAngle) {
  var angle = 360 / colorNum;
  var angle_start = Math.floor(colorAngle);
  var retColors = [];
  for (var i = 0; i < colorNum; i++) {
    retColors.push(hue2rgb((Math.floor(angle * i) + angle_start) % 360));
  }
  return retColors;
}

function hue2rgb(h) {
  // assume S = V = 1
  var r = 1;
  var g = 1;
  var b = 1;
  h /= 60;
  var i = Math.floor(h);
  var f = h - i;
  switch (i) {
    default:
    case 0:
      g *= f;
      b *= 0;
      break;
    case 1:
      r *= 1 - f;
      b *= 0;
      break;
    case 2:
      r *= 0;
      b *= f;
      break;
    case 3:
      r *= 0;
      g *= 1 - f;
      break;
    case 4:
      r *= f;
      g *= 0;
      break;
    case 5:
      g *= 0;
      b *= 1 - f;
      break;
  }
  r = Math.floor(255 * r);
  g = Math.floor(255 * g);
  b = Math.floor(255 * b);
  return (r << 16) + (g << 8) + b;
}



function phase_to_line_vectors(phase, parameter_condition_list, axis, maxDeltaT) {
  var line = [];
  var t;
  if (phase.simulation_state != "SIMULATED" && phase.simulation_state != "TIME_LIMIT" && phase.simulation_state != "STEP_LIMIT") return line;

  var env = {};
  $.extend(env, parameter_condition_list, phase.variable_map);

  if (phase.type == "PP") {
    env.t = phase.time.time_point;
    newPos = new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env));
    newPos.isPP = true;
    line.push(newPos);
  } else {
    var start_time = phase.time.start_time.getValue(env);
    var end_time = phase.time.end_time.getValue(env);
    if (!Number.isFinite(start_time) || !Number.isFinite(end_time)) throw new HydatException("invalid time interval: from" + phase.time.start_time + " to " + phase.time.end_time);
    var MIN_STEP = 10; // Minimum step of plotting one IP
    var delta_t = Math.min(maxDeltaT, (end_time - start_time) / MIN_STEP);
    for (t = start_time; t < end_time; t = t + delta_t) {
      env.t = new Constant(t);
      line.push(new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)));
    }
    env.t = new Constant(end_time);
    line.push(new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)));
  }
  return line;
}

function vector3_to_geometry(vector3_list) {
  var geometry = new THREE.Geometry();
  for (var i = 0; i < vector3_list.length; i++) {
    geometry.vertices.push(vector3_list[i]);
  }
  return geometry;
}


function check_parameter_condition(parameter_maps, parameter_condition_list) {
  var epsilon = 0.0001;
  for (var i = 0; i < parameter_maps.length; i++) {
    var included = true;
    for (var key in parameter_maps[i]) {
      if (parameter_condition_list[key] === undefined) continue;
      if (typeof parameter_maps[i][key].unique_value === 'undefined') {
        var lb = parameter_maps[i][key].lower_bounds[0].value.getValue(parameter_condition_list);
        var ub = parameter_maps[i][key].upper_bounds[0].value.getValue(parameter_condition_list);
        if (!(lb <= parameter_condition_list[key].getValue(parameter_condition_list) + epsilon
          && ub >= parameter_condition_list[key].getValue(parameter_condition_list) - epsilon)) {
          included = false;
        }
      } else if (!(parameter_maps[i][key].unique_value.getValue(parameter_condition_list) <= parameter_condition_list[key].getValue(parameter_condition_list) + epsilon
        && parameter_maps[i][key].unique_value.getValue(parameter_condition_list) >= parameter_condition_list[key].getValue(parameter_condition_list) - epsilon)) {
        included = false;
      }
    }
    if (included) {
      return true;
    }
  }
  return false;
}


function remove_plot(line) {
  if (line.plot != undefined) {
    for (var i = 0; i < line.plot.length; i++) {
      graph_scene.remove(line.plot[i]);
    }
    delete line.plot[i];
  }
  line.plot = [];
}
function remove_mesh(line) {
  if (line != undefined) {
    for (var i = 0; i < line.length; i++) {
      graph_scene.remove(line[i]);
      delete line[i];
    }
  }
  line.length = 0;
}



function toUnitVector(vector) {
  var unit_vector;
  var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  unit_vector.x = vector.x / length;
  unit_vector.y = vector.y / length;
  unit_vector.z = vector.z / length;
  return unit_vector;
}

function expandFrustum(orig, epsilon) {
  var expanded = orig.clone();
  expandTwoPlanesOfFrustum(expanded.planes[0], expanded.planes[1]);
  expandTwoPlanesOfFrustum(expanded.planes[2], expanded.planes[3]);
  expandTwoPlanesOfFrustum(expanded.planes[4], expanded.planes[5]);
  return expanded;
}


function expandTwoPlanesOfFrustum(plane1, plane2) {
  var dot = plane1.normal.dot(plane2.normal);
  var rate = 1.1;

  if (dot * plane1.constant * plane2.constant > 0) {
    if (Math.abs(plane1.constant) > Math.abs(plane2.constant)) {
      plane1.constant *= rate;
      plane2.constant /= rate;
    }
    else {
      plane1.constant /= rate;
      plane2.constant *= rate;
    }
  }
  else {
    plane1.constant *= rate;
    plane2.constant *= rate;
  }
  return;
}



function guard() {
  const g_geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  const g_material = new THREE.MeshBasicMaterial({
    color: 0x0000ff
    , wireframe: true
  });
  let guard = new THREE.Mesh(g_geometry, g_material);
  guard.position.set(0, 0, 0);
  //guard.rotation.set(0, Math.PI/2, Math.PI/2);//y
  guard.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  graph.scene.add(guard);
}


var face_all;
var face_a;
function range_make_all() {
  if (face_a != undefined) {
    remove_mesh(face_a);
  }
  face_a = [];
  var arr_face = 0;
  if (animation_line.length != 0) {
    for (let j = 0; j < animation_line.length - 1; j++) {
      var face_geometry = new THREE.Geometry();
      var time_r = 0;
      for (let i = 0; i < animation_line.maxlen; i++) {
        if (animation_line[j][time_r] == undefined) {
          break;
        } else if (animation_line[j + 1][time_r] == undefined) {
          break;
        } else {
          face_geometry.vertices.push(new THREE.Vector3(animation_line[j][time_r].x, animation_line[j][time_r].y, animation_line[j][time_r].z));
          face_geometry.vertices.push(new THREE.Vector3(animation_line[j + 1][time_r].x, animation_line[j + 1][time_r].y, animation_line[j + 1][time_r].z));
        }
        time_r++;
      }
      for (let k = 0; k < face_geometry.vertices.length - 2; k++) {
        face_geometry.faces.push(new THREE.Face3(k, (k + 1), (k + 2)));
      }
      face_geometry.computeFaceNormals();
      face_geometry.computeVertexNormals();
      face_all = new THREE.Mesh(face_geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: true, transparent: true, side: THREE.DoubleSide, opacity: 0.5 }));
      graph.scene.add(face_all);
      face_a[arr_face] = (face_all);
      arr_face++;
    }
    render_three_js();
  }
}



// }
