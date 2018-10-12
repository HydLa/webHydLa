/* initially written by Takafumi Horiuchi (2018.10) */
const inf = 10, eps = 0.05;
const splitAt = index => x => [x.slice(0, index), x.slice(index)];
var guard_list; // e.g. [ y-=0, (x-=0|x-=6), y-=4&0<=x-&x-<=2, x-=2&2<=y-&y-<=4, y-=2&2<=x-&x-<=4, x-=4&0<=y-&y-<=2]

function draw_guard() {
	console.log("EXECUTING draw_guard_new");
	// all guards contained in hydla program
	console.log("guard_list: " + guard_list);
	// e.g. ["y-=0", "(x-=0|x-=6)", "y-=4&0<=x-&x-<=2"]
	
	// iterate each clause // e.g. guard_list[3]: 4<=x-&x-<=6&(y-=2|y-=4)
	for (var cls_i in guard_list) {
		console.log("guard_list[" + cls_i + "]: " + guard_list[cls_i]);

		// cf: 4<=x-&x-<=6&(y-=2|y-=4)
		var clause = parse_rm_leftlim(guard_list[cls_i]);
		// ここまではOK

		// ここから、どのように「&」と「|」の結合を捉えるか

		// cf: 4<=x&x<=6&(y=2|y=4)
		var literals = parse_conjunction(clause); // とりあえず「&」で切る
		console.log(literals);
		// cf: ["4<=x", "x<=6", "(y=2|y=4)"]

		var rectangular_todepict = [];
		var rectangular_totake_intersection = []; // 本当はリストのリストであるべき
		for (var lit_i in literals) {
			console.log("literal: " + literals[lit_i]);
			if (literals[lit_i].includes('|')) { // disjunctions(|) // union
				
				// 正しいパージングをしていないので、ある具体例にしか適用できない："(y=2|y=4)"
				// "|"で区切る
				// "("と")"を削除する
				// y=2などが残るので、そのrectangularを作成する（use 既存の関数）
				
				var inner_litlst = parse_disjunction(literals[lit_i]);
				console.log("DISJUNCTION");
				console.log(inner_litlst);
				for (i in inner_litlst) {
					var rectangular = literal_to_rectangular(inner_litlst[i]);
					rectangular_todepict.push(rectangular);
				}


				// rectangular_todepict.push();
			} else { // conjunctions(&) // intersection
				var rectangular = literal_to_rectangular(literals[lit_i]);
				rectangular_totake_intersection.push(rectangular);
			}
		} // end of iteration of literal
		
		console.log("rectangular_totake_intersection");
		console.log(rectangular_totake_intersection);
		rectangular_todepict.push(take_intersection(rectangular_totake_intersection));

		draw_rectangulars(rectangular_todepict);
	} // end of iteration of clause

	return;
} // end of draw_guard()

// e.g. "4<=x" : create rectangular of [x:4~inf, y:-inf~inf, z:-inf~int]
function literal_to_rectangular(literal) {
	var lit_variable, lit_value;
	var literal_separators = [">=", "<=", '=', '<', '>'];
	var litsep_index, litsep_i; // need scope outsize of loop
	for (litsep_i=0; litsep_i<literal_separators.length; litsep_i++) {
		litsep_index = literal.indexOf(literal_separators[litsep_i]);
		if (litsep_index > -1) {
			lit_nocomp = literal.replace(literal_separators[litsep_i], '');
			break;
		} else { continue; }
	}
	var lit_tokens = splitAt(litsep_index)(lit_nocomp);
	var comp_sign = literal_separators[litsep_i];
	if (lit_tokens[0].match(/[a-z]/i)) { // contains alphabet => variable
		// style: "variable (comp) value"
		lit_variable = lit_tokens[0];
		lit_value = parseFloat(lit_tokens[1]);
	} else { // no alphabets => value (not considering equations with variables)
		// style:  "value (comp) variable"
		lit_variable = lit_tokens[1];
		lit_value = parseFloat(lit_tokens[0]);
		// transform to style: "variable (comp) value"
		if (comp_sign == "<") comp_sign = ">";
		else if (comp_sign == "<=") comp_sign = ">=";
	}
	console.log("lit_value: " + lit_value); // 定数のみの数式が含まれる。記号計算で計算するようにすれば、変数なしの数式も扱えるようになる。
	console.log("lit_variable: " + lit_variable);
	console.log("comp_sign: " + comp_sign);

	// このリテラルの直方体の範囲のdictionaryをrect...intersection[]にpushする
	var line_settings = settingsForCurrentHydat.plot_line_settings;
	var rectangular = {};
	for (var ls_i in line_settings) {
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
		// rectangular_totake_intersection.push(rectangular);
	} // end of line_settings
	return rectangular;
}

function draw_rectangulars(rectangulars) {
	for (i in rectangulars) {

		// このループが何のために必要なのかが理解できていない
		var line_settings = settingsForCurrentHydat.plot_line_settings;
		for (var ls_i in line_settings) {
			var x_length = rectangulars[i]["axis_" + line_settings[ls_i].x]["right"] - rectangulars[i]["axis_" + line_settings[ls_i].x]["left"];
			var x_start = rectangulars[i]["axis_" + line_settings[ls_i].x]["left"] + x_length/2;
			var y_length = rectangulars[i]["axis_" + line_settings[ls_i].y]["right"] - rectangulars[i]["axis_" + line_settings[ls_i].y]["left"];
			var y_start = rectangulars[i]["axis_" + line_settings[ls_i].y]["left"] + y_length/2;
			var z_length = rectangulars[i]["axis_" + line_settings[ls_i].z]["right"] - rectangulars[i]["axis_" + line_settings[ls_i].z]["left"];
			var z_start = rectangulars[i]["axis_" + line_settings[ls_i].z]["left"] + z_length/2;
		
			var g_geometry = new THREE.BoxGeometry(x_length, y_length, z_length);
			var g_material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
			var guard_line = new THREE.Mesh(g_geometry, g_material);
			guard_line.position.set(x_start, y_start, z_start);
			graph_scene.add(guard_line);
		}

	}
	return;
}


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
	var clause_noparentheses = parse_rm_parentheses(clause);
	var literals = clause_noparentheses.split(new RegExp(conjunction_separators.join('|'), 'g'));
	return literals;
}

function parse_disjunction(clause) {
	var clause_noparentheses = parse_rm_parentheses(clause);
	var disjunction_separators = ["\\\|"];
	var literals = clause_noparentheses.split(new RegExp(disjunction_separators.join('|'), 'g'));
	return literals;
}

function parse_rm_parentheses(clause) {
	return clause.replace(/[()]/g, '');
}
