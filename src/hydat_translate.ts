class HydatException extends Error{
  constructor(message) {
    super();
    Object.defineProperty(this, 'name', {           
      get: () => this.constructor.name,
    });
    Object.defineProperty(this, 'message', {
      get: () => message,
    });
  }
}

function translate(hydat) {
  for (var i = 0; i < hydat.first_phases.length; i++) {
    translate_phase(hydat.first_phases[i]);
  }
  translate_parameter_map(hydat.parameters);
}

function translate_phase(phase) {
  if (phase.type == "PP") {
    phase.time.time_point = Construct.parse(phase.time.time_point);
  } else {
    phase.time.start_time = Construct.parse(phase.time.start_time);
    if (phase.time.end_time == undefined || phase.time.end_time == "Infinity") {
      phase.time.end_time = new Plus(new Constant(2), phase.time.start_time);
    }
    else {
      phase.time.end_time = Construct.parse(phase.time.end_time);
    }
  }
  for (var key in phase.variable_map) {
    if (phase.variable_map[key].unique_value == undefined) throw new HydatException("webHydLa doesn't support ununique value in variable maps for " + key);
    phase.variable_map[key] = Construct.parse(phase.variable_map[key].unique_value, phase.variable_map);
  }

  for (var i = 0; i < phase.parameter_maps.length; i++) {
    translate_parameter_map(phase.parameter_maps[i]);
  }

  for (var i = 0; phase.children.length > i; i++) {
    translate_phase(phase.children[i]);
  }
  return 0;
}

function translate_parameter_map(parameter_map) {
  for (var key in parameter_map) {
    if (parameter_map[key].unique_value == undefined) {
      for (var i = 0; i < parameter_map[key].lower_bounds.length; i++) {
        parameter_map[key].lower_bounds[i].value = Construct.parse(parameter_map[key].lower_bounds[i].value);
      }
      for (var i = 0; i < parameter_map[key].upper_bounds.length; i++) {
        parameter_map[key].upper_bounds[i].value = Construct.parse(parameter_map[key].upper_bounds[i].value);
      }
    } else {
      parameter_map[key].unique_value = Construct.parse(parameter_map[key].unique_value);
    }
  }
}

function apply_parameter_to_expr(expr:string, parameter_value_list:{[key:string]:string}) {
  var ret_expr = expr;
  for (let key in parameter_value_list) {
    while (ret_expr.indexOf(key, 0) != -1) {
      ret_expr = ret_expr.replace(key, parameter_value_list[key]);
    }
  }
  return ret_expr;
}
