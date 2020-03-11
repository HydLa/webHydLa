import { PlotLineMapControl } from "./plot_line_map_control";
import { GraphControl } from "./graph_control";


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

// function toUnitVector(vector:THREE.Vector3) {
//   let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
//   return new THREE.Vector3(vector.x / length, vector.y / length, vector.z / length);
// }

// function guard() {
//   const g_geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
//   const g_material = new THREE.MeshBasicMaterial({
//     color: 0x0000ff
//     , wireframe: true
//   });
//   let guard = new THREE.Mesh(g_geometry, g_material);
//   guard.position.set(0, 0, 0);
//   //guard.rotation.set(0, Math.PI/2, Math.PI/2);//y
//   guard.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
//   GraphControl.scene.add(guard);
// }
