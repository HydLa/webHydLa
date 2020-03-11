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


// function vector3_to_geometry(vector3_list:THREE.Vector3[]) {
//   let geometry = new THREE.Geometry();
//   for (let vec of vector3_list) {
//     geometry.vertices.push(vec);
//   }
//   return geometry;
// }





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
