/* initially written by Takafumi Horiuchi (2018.10) */

// want to adjust "inf" according to the trajectory's maximum range of each axis
const inf = 20, eps = 0.05;

// "operators" must be in order of priority
// "/\" and "\/" are replaced by "&" and "|" respectively
const operators = ["&", "|"];

// elements appended in guard_depiction_setup()
var rectangulars_to_draw = [];


// call this function in add_plot_each()
function draw_guard() {
	console.log("STARTING TO DRAW RECTANGULARS");
	draw_rectangulars(rectangulars_to_draw);
	console.log("FINISHED DRAWING RECTANGULARS");
	return;
}


// call this function once when hydat is loaded
function guard_depiction_setup(hydat) {
	// c.f: ["y-=0", "(x-=0|x-=6)", "y-=4&0<=x-&x-<=2"]
	var guard_list = hydat.guards;
	// iterate each clause
	for (var cls_i in guard_list) {
		// cf: 4<=x-/\x-<=6/\(y-=2\/y-=4)
		var guard_noleftlim = parse_rm_leftlim(guard_list[cls_i]);
		// cf: 4<=x/\x<=6/\(y=2\/y=4)
		var infix_clause = parse_mv_logicalop(guard_noleftlim);
		// cf: 4<=x&x<=6&(y=2|y=4)
		var postfix_clause = shunting_yard(infix_clause);
		// cf: [4<=x,x<=6,&,y=2,y=4,|,&]
		var rectlist_stack = []; // list of list of rectangulars
		var tokens_buf = postfix_clause.slice().reverse(); // pop() pops from tail
		// evaluate reverse-polish expression
		while (tokens_buf.length > 0) {
			var tok = tokens_buf.pop();
			if (operators.indexOf(tok) > -1) { // tok is an operator
				var op = tok;
				var rectlist_1 = rectlist_stack.pop(); // [...,{},...]
				var rectlist_2 = rectlist_stack.pop(); // [...,{},...]
				exec_operation(rectlist_1, rectlist_2, op, rectlist_stack);
			}
			else { // tok is an literal
				var literal = tok;
				var rectlist = [literal_to_rectangular(literal)]; // [{}]
				rectlist_stack.push(rectlist); // [...,[{}]]
			}
		}
		// rectlist_stack should contain exactly one list in its list
		var guard_representation = rectlist_stack[0];
		for (i in guard_representation) {
			rectangulars_to_draw.push(guard_representation[i]);
		}
	}
}


// array arguments in javascripts are call by reference
function exec_operation(rectlist_1, rectlist_2, op, rectlist_stack) {
	var tmp_rectlist = [];
	if (op == "&") {
		for (i in rectlist_1) {
			for (j in rectlist_2) {
				var processing_rect = [rectlist_1[i], rectlist_2[j]];
				var intersect_rect = take_intersection(processing_rect);
				tmp_rectlist.push(intersect_rect); // [...,{}]
			}
		}
	}
	else if (op == "|") {
		tmp_rectlist = rectlist_1.concat(rectlist_2);
	}
	else { /* parse error */ }

	rectlist_stack.push(tmp_rectlist);
	return;
}


// convert to reverse polish notation
// takes original string of guard as argument
// returns a list of tokens in postfix order
function shunting_yard(infix_clause) {
	function precedence(token) {return operators.slice().reverse().indexOf(token);}
	function peek(list) {if (list.length > 0) return list[list.length-1]; else return "none";}
	// e.g: y-=4&0<=x-&x-<=2
	var tokens_infix = infix_clause.split(/(\(|\)|\&|\|)/g).filter(Boolean);
	// e.g: y=4,&,0<=x,&,x<=2
	var operand_list = [];
	var operator_stack = [];
	var tokens_buffer = tokens_infix.slice().reverse(); // pop() takes from tail
	// shunting yard algorithm
	while (tokens_buffer.length > 0) {
		var tok = tokens_buffer.pop();
		if (operators.indexOf(tok) > -1) { // if token is "&" or "|"
			while (precedence(tok) <= precedence(peek(operator_stack))) {
				var tok_opstk = operator_stack.pop();
				operand_list.push(tok_opstk);
			}
			operator_stack.push(tok);
		}
		else if (tok == "(") {
			operator_stack.push(tok);
		}
		else if (tok == ")") {
			while (true) {
				var tok_opstk = operator_stack.pop();
				if (tok_opstk == "(") break;
				else operand_list.push(tok_opstk);
			}
		}
		else { // if token is a literal (e.g: x=0)
			operand_list.push(tok);
		}
	}
	// move the rest of stack to list
	while (operator_stack.length > 0) {
		var tok_opstk = operator_stack.pop();
		operand_list.push(tok_opstk);
	}
	return operand_list;
}


// TODO: この関数を修正して、より汎用的に改良する
// e.g. "4<=x" : create rectangular of [x:4~inf, y:-inf~inf, z:-inf~int]
function literal_to_rectangular(literal) {
	const splitAt = index => x => [x.slice(0, index), x.slice(index)];
	var lit_variable, lit_value;
	// TODO: forgetting negation "!=" ...?
	var literal_separators = [">=", "<=", '=', '<', '>'];
	var litsep_index, litsep_i; // need scope outside of loop
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
	// TODO: このline_settingsの詳細がわからない
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

	} // end of line_settings
	return rectangular;
}


function draw_rectangulars(rectangulars) {
	// rectangulars: a list of rectangulars // [{...}, {...}, ...]
	for (i in rectangulars) {
		// TODO: このループが何のために必要なのかが理解できていない
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


function take_intersection(rectangular_list) {
	//	rectangular_list = [
	//	{"x": {"left": vall1, "right": valr1}, 'y': {"left": vall1, "right": valr1}, 'z': {"left": vall1, "right": valr1}},
	//	{"x": {"left": vall2, "right": valr2}, 'y': {"left": vall2, "right": valr2}, 'z': {"left": vall2, "right": valr2}},...]
	var num_rect = rectangular_list.length;
	var intersected_rectangular = {};
	var x_lefts = [];
	var x_rights = [];
	var y_lefts = [];
	var y_rights = [];
	var z_lefts = [];
	var z_rights = [];
	// TODO: このline_settingsが複数ある意味が理解できていない。
	var line_settings = settingsForCurrentHydat.plot_line_settings;
	for (var ls_i in line_settings) {
		for (var i=0; i<num_rect; i++) {
			// {"axis_(x)": {"left": vall1, "right": valr1}, 'axis_(y)': {"left": vall1, "right": valr1}, 'axis_(z)': {"left": vall1, "right": valr1}}
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
	return intersected_rectangular; // {}
}


function parse_rm_leftlim(guard) {
	return guard.replace(/-(?=[^a-zA-Z0-9])/g, '');
}


function parse_mv_logicalop(guard) {
	var and_replaced = guard.replace(/\/\\/g, '&');
	var and_or_replaced = and_replaced.replace(/\\\//g, '|');
	return and_or_replaced;
}
