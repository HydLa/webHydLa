/* initially written by Takafumi Horiuchi (2018.10) */

var guard_list; // c.f: [y-=0,(x-=0|x-=6),y-=4&0<=x-&x-<=2,...]

const inf = 10, eps = 0.05;

// call this function once when hydat is loaded
function guard_depiction_setup(hydat) {
	guard_list = hydat.guards;
}

// TODO: modify to avoid repetition of calculation
function draw_guard()
{
	console.log("EXECUTING draw_guard_new");
	// all guards contained in hydla program
	console.log("guard_list: " + guard_list);
	// e.g. ["y-=0", "(x-=0|x-=6)", "y-=4&0<=x-&x-<=2"]
	
	// iterate each clause // e.g. guard_list[3]: 4<=x-&x-<=6&(y-=2|y-=4)
	for (var cls_i in guard_list) {
		console.log("guard_list[" + cls_i + "]: " + guard_list[cls_i]);

		// cf: 4<=x-&x-<=6&(y-=2|y-=4) []
		var infix_clause = parse_rm_leftlim(guard_list[cls_i]);
		// cf: 4<=x&x<=6&(y=2|y=4)
		var postfix_clause = shunting_yard(infix_clause);
		// cf: 4<=x x<=6 & y=2 y=4 | &

		var rectlist_stack = []; // list of list of rectangulars
		var operators = ["&", "|"]; // order does not matter
		var tokens_buf = postfix_clause.slice().reverse();
		while(tokens_buf.length > 0) {
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
		draw_rectangulars(rectlist_stack[0]);

		/*
		////////////////////////////////////////////////////////////////////
		// 旧実装

		var literals = parse_conjunction(infix_clause); // とりあえず「&」で切る
		// cf: ["4<=x", "x<=6", "(y=2|y=4)"]

		var rectangular_todepict = [];
		var rectangular_totake_intersection = []; // 本当はリストのリストであるべき
		for (var lit_i in literals) {
			
			if (literals[lit_i].includes('|')) { // disjunctions(|) // union	
				var inner_litlst = parse_disjunction(literals[lit_i]);
				for (i in inner_litlst) {
					var rectangular = literal_to_rectangular(inner_litlst[i]);
					rectangular_todepict.push(rectangular);
				}
			} else { // conjunctions(&) // intersection
				var rectangular = literal_to_rectangular(literals[lit_i]);
				rectangular_totake_intersection.push(rectangular);
			}

		} // end of iteration of literal
		
		console.log("rectangular_totake_intersection");
		console.log(rectangular_totake_intersection);
		rectangular_todepict.push(take_intersection_multiple(rectangular_totake_intersection));

		draw_rectangulars(rectangular_todepict);
		*/

	} // end of iteration of clause

	return;
} // end of draw_guard()

// array arguments in javascripts are call by reference
function exec_operation(rectlist_1, rectlist_2, op, rectlist_stack) {
	// TODO: adapt to suit "/\" and "\/"
	var tmp_rectlist = [];
	if (op == "&") {
		for (i in rectlist_1) {
			for (j in rectlist_2) {
				tmp_rectlist.push(take_intersection(rectlist_1[i], rectlist_2[j])); // [...,{}]
			}
		}
	}
	else if (op == "|") {
		tmp_rectlist = rectlist_1.concat(rectlist_2);
		// for (i in rectlist_1) tmp_rectlist.push(rectlist_1[i]);
		// for (i in rectlist_2) tmp_rectlist.push(rectlist_2[i]);
	}
	else { /* oops... seems like something went wrong. */ }

	rectlist_stack.push(tmp_rectlist);
	return;
}

// convert to reverse polish notation
// takes original string of guard as argument
// returns a list of tokens in postfix order
function shunting_yard(infix_clause) {
	// console.log("shonting_yard: " + infix_clause);
	// e.g: y-=4&0<=x-&x-<=2
	var tokens_infix = infix_clause.split(/(\(|\)|\&|\|)/g).filter(Boolean);
	console.log("tokens_infix: " + tokens_infix);
	// e.g: y=4,&,0<=x,&,x<=2

	var operators = ["&", "|"]; // must be in order of priority
	function precedence(token) {return operators.slice().reverse().indexOf(token);}
	function peek(list) {if (list.length > 0) return list[list.length-1]; else return "none";}
	var operand_list = [];
	var operator_stack = [];
	var tokens_buffer = tokens_infix.slice().reverse(); // javascript pop() takes from tail of array

	// shunting yard algorithm
	while (tokens_buffer.length > 0) {
		var tok = tokens_buffer.pop();
		if (operators.indexOf(tok) > -1) { // if token is &, |, ...
			console.log("in operator with tok of: " + tok);
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
	// move the rest to list
	while (operator_stack.length > 0) {
		var tok_opstk = operator_stack.pop();
		operand_list.push(tok_opstk);
	}

	console.log("tokens_postfix: " + operand_list);
	return operand_list;
}

// e.g. "4<=x" : create rectangular of [x:4~inf, y:-inf~inf, z:-inf~int]
function literal_to_rectangular(literal) {
	const splitAt = index => x => [x.slice(0, index), x.slice(index)];
	var lit_variable, lit_value;
	var literal_separators = [">=", "<=", '=', '<', '>']; // forgetting negation "!=" ...?
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

// returns a rectangular: {}
function take_intersection(rect1, rect2) {
	var rectangular_list = [rect1, rect2];
	var num_rect = rectangular_list.length;
	var intersected_rectangular = {};
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


//	rectangular_totake_intersection = [
//		{"x": {"left": vall1, "right": valr1}, 'y': {"left": val, "right": val}, 'z': {"left": val, "right": val}},
//		{"x": {"left": vall2, "right": valr2}, 'y': {"left": val, "right": val}, 'z': {"left": val, "right": val}},
//		{"x": {"left": vall3, "right": valr3}, 'y': {"left": val, "right": val}, 'z': {"left": val, "right": val}},
// 		...,
//	]
function take_intersection_multiple(rectangular_list) {
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
