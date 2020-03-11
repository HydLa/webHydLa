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




// }
