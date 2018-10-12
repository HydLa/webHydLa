/* initially written by Takafumi Horiuchi (2018.10) */

const inf = 10, eps = 0.05;
const splitAt = index => x => [x.slice(0, index), x.slice(index)];

// "guard_list" contains ["y-=0", ...]; i.e. left side of "=>"
var guard_list;

function draw_guard_new() {
	console.log("EXECUTING draw_guard_new");
	// all guards contained in hydla program
	console.log("guard_list: " + guard_list);
	// e.g. ["y-=0", "(x-=0|x-=6)", "y-=4&0<=x-&x-<=2"]
	
	// iterate each clause
	// e.g. guard_list[3]: 4<=x-&x-<=6&(y-=2|y-=4)
	for (var cls_i in guard_list) {
		console.log("guard_list[" + cls_i + "]: " + guard_list[cls_i]);

		// cf: 4<=x-&x-<=6&(y-=2|y-=4)
		var clause = parse_rm_leftlim(guard_list[cls_i]);
		// cf: 4<=x&x<=6&(y=2|y=4)
		var literals = parse_conjunction(clause);
		console.log(literals);

		// cf: ["4<=x", "x<=6", "(y=2|y=4)"]
		var rectangular_totake_intersection = [];
		for (var lit_i in literals) {
			console.log("literal: " + literals[lit_i]);

			if (literals[lit_i].includes('|')) {
				// create and take union of these rectangulars; append to rect...intersection[]
				// 

			} else {
				// create rectangulars; append to rect...intersection[]
				// e.g. "4<=x"
				// create rectangular of [x:4~inf, y:-inf~inf, z:-inf~int]

				var lit_variable, lit_value;
				
				var lit_rmcomp;
				var literal_separators = [">=", "<=", '=', '<', '>'];
				var litsep_index;
				var litsep_i;
				for (litsep_i=0; litsep_i<literal_separators.length; litsep_i++) {
					litsep_index = literals[lit_i].indexOf(literal_separators[litsep_i]);
					if (litsep_index > -1) {
						lit_nocomp = literals[lit_i].replace(literal_separators[litsep_i], '');
						break;
					} else {
						continue;
					}
				}
				var lit_tokens = splitAt(litsep_index)(lit_nocomp);
				var comp_sign = literal_separators[litsep_i];
				if (lit_tokens[0].match(/[a-z]/i)) { // contains alphabet => variable
					// variable (comp) value
					lit_variable = lit_tokens[0];
					lit_value = parseFloat(lit_tokens[1]);
				} else { // no alphabets => value (not considering equations with variables)
					// value (comp) variable
					lit_variable = lit_tokens[1];
					lit_value = parseFloat(lit_tokens[0]);
					// variable (comp) value の形式に一般化して考える
					if (comp_sign == "<") comp_sign = ">";
					else if (comp_sign == "<=") comp_sign = ">=";
				}
				console.log("lit_value: " + lit_value); // 定数のみの数式が含まれる。記号計算で計算するようにすれば、変数なしの数式も扱えるようになる。
				console.log("lit_variable: " + lit_variable);
				console.log("comp_sign: " + comp_sign);

				// このリテラルの直方体の範囲のdictionaryをrect...intersection[]にpushする
				var line_settings = settingsForCurrentHydat.plot_line_settings;
				for (var ls_i in line_settings) {
					var rectangular = {};
					if (lit_variable == line_settings[ls_i].x)  {
						if (comp_sign == "=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": lit_value-eps, "right": lit_value+eps};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": inf};
						} else if (comp_sign == "<" | comp_sign == "<=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": lit_value};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": inf};
						} else if (comp_sign == ">" | comp_sign == ">=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": lit_value, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": inf};
						}
					} else if (lit_variable == line_settings[ls_i].y)  {
						if (comp_sign == "=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": lit_value-eps, "right": lit_value+eps};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": inf};
						} else if (comp_sign == "<" | comp_sign == "<=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": lit_value};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": inf};
						} else if (comp_sign == ">" | comp_sign == ">=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": lit_value, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": inf};
						}
					} else if (lit_variable == line_settings[ls_i].z)  {
						if (comp_sign == "=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": lit_value-eps, "right": lit_value+eps};
						} else if (comp_sign == "<" | comp_sign == "<=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": -inf, "right": lit_value};
						} else if (comp_sign == ">" | comp_sign == ">=") {
							rectangular["axis_" + line_settings[ls_i].x] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].y] = {"left": -inf, "right": inf};
							rectangular["axis_" + line_settings[ls_i].z] = {"left": lit_value, "right": inf};
						}
					}
					rectangular_totake_intersection.push(rectangular);
				} // end of line_settings


			}

		} // end of iteration of literal
		
		console.log("rectangular_totake_intersection");
		console.log(rectangular_totake_intersection);
		// ここで、rect...section[]に格納された直方体のintersectionをとる
		var rectangular_todepict = take_intersection(rectangular_totake_intersection);

		draw_rectangular(rectangular_todepict);


	} // end of iteration of clause

	return;
} // end of draw_guard()

function draw_rectangular(rectangular) {
	// このループが何のために必要なのかが理解できていない
	var line_settings = settingsForCurrentHydat.plot_line_settings;
	for (var ls_i in line_settings) {
		var x_length = rectangular["axis_" + line_settings[ls_i].x]["right"] - rectangular["axis_" + line_settings[ls_i].x]["left"];
		var x_start = rectangular["axis_" + line_settings[ls_i].x]["left"] + x_length/2;
		var y_length = rectangular["axis_" + line_settings[ls_i].y]["right"] - rectangular["axis_" + line_settings[ls_i].y]["left"];
		var y_start = rectangular["axis_" + line_settings[ls_i].y]["left"] + y_length/2;
		var z_length = rectangular["axis_" + line_settings[ls_i].z]["right"] - rectangular["axis_" + line_settings[ls_i].z]["left"];
		var z_start = rectangular["axis_" + line_settings[ls_i].z]["left"] + z_length/2;
	
		var g_geometry = new THREE.BoxGeometry(x_length, y_length, z_length);
		var g_material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
		var guard_line = new THREE.Mesh(g_geometry, g_material);
		guard_line.position.set(x_start, y_start, z_start);
		graph_scene.add(guard_line);
		// なんだか変なところに変なサイズで描画されてしまっている。
	}
	return;
}
/*
var g_geometry = new THREE.CylinderGeometry(0.03,0.03,100); // 本当は、解軌道の長さ分だけ描画したい
var g_material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: false});
var guard_line = new THREE.Mesh(g_geometry, g_material);
var line_settings = settingsForCurrentHydat.plot_line_settings;
for (var j in line_settings) {
	if (guard_lhs == line_settings[j].x)  {
		console.log("draw x-line");
		guard_line.rotation.set(0, 0, 0);
		guard_line.position.set(guard_rhs, 0, 0);
	} 
	else if (guard_lhs == line_settings[j].y)  {
		console.log("draw y-line");
		guard_line.rotation.set(0, 0, -Math.PI/2);
		guard_line.position.set(0, guard_rhs, 0);
	}
	else if (guard_lhs == line_settings[j].z)  {
		console.log("draw z-line");
		guard_line.rotation.set(-Math.PI/2, 0, 0);
		guard_line.position.set(0, guard_rhs, 0);
	} else {
		console.log("no match, sorry...");
	}
	graph_scene.add(guard_line);
}
*/


//	rectangular_totake_intersection = [
//		{"x": {"left": vall1, "right": valr1}, 'y': {"left": val, "right": val}, 'z': {"left": val, "right": val}},
//		{"x": {"left": vall2, "right": valr2}, 'y': {"left": val, "right": val}, 'z': {"left": val, "right": val}},
//		{"x": {"left": vall3, "right": valr3}, 'y': {"left": val, "right": val}, 'z': {"left": val, "right": val}},
// 		...,
//	]
function take_intersection(rectangular_list) {
	var intersected_rectangular = {};
	var num_rect = rectangular_list.length;
	var x_lefts = [];
	var x_rights = [];
	var y_lefts = [];
	var y_rights = [];
	var z_lefts = [];
	var z_rights = [];
	var line_settings = settingsForCurrentHydat.plot_line_settings;
	// このline_settingsが複数ある意味が理解できていない。
	for (var ls_i in line_settings) {

		for (var i=0; i<num_rect; i++) {
			// これの正しいシンタックスがわからない。
			x_lefts.push(rectangular_list[i]["axis_" + line_settings[ls_i].x]["left"]);
			x_rights.push(rectangular_list[i]["axis_" + line_settings[ls_i].x]["right"]);
			y_lefts.push(rectangular_list[i]["axis_" + line_settings[ls_i].y]["left"]);
			y_rights.push(rectangular_list[i]["axis_" + line_settings[ls_i].y]["right"]);
			z_lefts.push(rectangular_list[i]["axis_" + line_settings[ls_i].z]["left"]);
			z_rights.push(rectangular_list[i]["axis_" + line_settings[ls_i].z]["right"]);
		}

		// range of x
		intersected_rectangular["axis_" + line_settings[ls_i].x] = {
			"left": Math.max.apply(null, x_lefts),
			"right": Math.min.apply(null, x_rights)
		}
		// range of y
		intersected_rectangular["axis_" + line_settings[ls_i].y] = {
			"left": Math.max.apply(null, y_lefts),
			"right": Math.min.apply(null, y_rights)
		}
		// range of z
		intersected_rectangular["axis_" + line_settings[ls_i].z] = {
			"left": Math.max.apply(null, z_lefts),
			"right": Math.min.apply(null, z_rights)
		}

	}
	
	console.log("x_lefts");
	console.log(x_lefts);

	console.log("intersected_rectangular:");
	console.log(intersected_rectangular);

	return intersected_rectangular;
}

function parse_rm_leftlim(guard) {
	return guard.replace(/-(?=[^a-zA-Z0-9])/g, '');
}

// cf: 4<=x&x<=6&(y=2|y=4)
// まずはこの例だけに絞って考察する。あとで一般的なものに修正する。
function parse_conjunction(clause) {
	var conjunction_separators = ["\\\&"];
	var literals = clause.split(new RegExp(conjunction_separators.join('|'), 'g'));
	return literals;
}


function draw_guard() {
	// all guards contained in hydla program
	console.log("guard_list: " + guard_list);
	// e.g. ["y-=0", "(x-=0|x-=6)", "y-=4&0<=x-&x-<=2"]
	
	// iterate each clause
	for (var cls_i in guard_list) {
		console.log("guard_list[" + cls_i + "]: " + guard_list[cls_i]);

		// まず、「|」と「&」と「/\」と「\/」で分割する
		var clause_separators = ["\\\&", "\\\|", "/\\", "\\/"];
		var guard_literal = guard_list[cls_i].split(new RegExp(clause_separators.join('|'), 'g'));
		
		// iterate each literal
		for (var lit_i in guard_literal) {

			console.log("guard_literal[" + lit_i + "]: " + guard_literal[lit_i]);

			var guard_lhs;
			var guard_rhs;
			var literal_separators = ['=', ">=", "<=", '<', '>'];
			var guard_tokens = guard_literal[lit_i].split(new RegExp(literal_separators.join('|'), 'g'));
			// console.log("guard_tokens: " + guard_tokens);
			guard_lhs = guard_tokens[0].replace('-', '').replace('(', '');
			guard_rhs = guard_tokens[1].replace(')', '');

			console.log("guard_lhs: " + guard_lhs);
			console.log("guard_rhs: " + guard_rhs);

			// a rectangular may be better (3次元にも対応するため)
			var g_geometry = new THREE.CylinderGeometry(0.03,0.03,100); // 本当は、解軌道の長さ分だけ描画したい
			var g_material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: false});
			var guard_line = new THREE.Mesh(g_geometry, g_material);
			var line_settings = settingsForCurrentHydat.plot_line_settings;
			for (var j in line_settings) {
				if (guard_lhs == line_settings[j].x)  {
					console.log("draw x-line");
					guard_line.rotation.set(0, 0, 0);
					guard_line.position.set(guard_rhs, 0, 0);
				} 
				else if (guard_lhs == line_settings[j].y)  {
					console.log("draw y-line");
					guard_line.rotation.set(0, 0, -Math.PI/2);
					guard_line.position.set(0, guard_rhs, 0);
				}
				else if (guard_lhs == line_settings[j].z)  {
					console.log("draw z-line");
					guard_line.rotation.set(-Math.PI/2, 0, 0);
					guard_line.position.set(0, guard_rhs, 0);
				} else {
					console.log("no match, sorry...");
				}
				graph_scene.add(guard_line);
			}

		} // end of iteration of literal

	} // end of iteration of clause

} // end of draw_guard()


/*
notes:

PlaneGeometry(width:Float, height:Float, 
              widthSegments:Integer, heightSegments:Integer)
  width — Width along the X axis. Default is 1.
  height — Height along the Y axis. Default is 1.
  widthSegments — Optional. Default is 1. 
  heightSegments — Optional. Default is 1.

MeshBasicMaterial( parameters : Object )
  parameters - (optional) an object with one or more properties 
               defining the material's appearance. 
               Any property of the material (including any property inherited 
               from Material) can be passed in here.
               The exception is the property color, which can be passed in as 
               a hexadecimal string and is 0xffffff (white) by default.

Mesh( geometry : Geometry, material : Material )
  geometry — (optional) an instance of Geometry or BufferGeometry. 
             Default is a new BufferGeometry.
  material — (optional) a single or an array of Material.
             Default is a new MeshBasicMaterial

.position : Vector3
A Vector3 representing the object's local position. Default is (0, 0, 0).


*/
