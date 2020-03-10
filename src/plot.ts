function HydatException(message)
{
  this.name = "HydatException";
  this.message = message;
}

function translate(hydat){
  for(var i = 0; i < hydat.first_phases.length; i++)
  {
    translate_phase(hydat.first_phases[i]);
  }
  translate_parameter_map(hydat.parameters);
}

function translate_phase(phase){
  if(phase.type=="PP"){
    phase.time.time_point = parseValue(phase.time.time_point);
  }else{
    phase.time.start_time = parseValue(phase.time.start_time);
    if(phase.time.end_time == undefined || phase.time.end_time == "Infinity"){
      phase.time.end_time = new Plus(new Constant(2), phase.time.start_time);
    }
    else
    {
      phase.time.end_time = parseValue(phase.time.end_time);
    }
  }
  for(var key in phase.variable_map){
    if(phase.variable_map[key].unique_value == undefined)throw new HydatException("webHydLa doesn't support ununique value in variable maps for " + key);
    phase.variable_map[key] = parseValue(phase.variable_map[key].unique_value, phase.variable_map);
  }

  for(var i = 0; i < phase.parameter_maps.length; i++)
  {
    translate_parameter_map(phase.parameter_maps[i]);
  }

  for(var i = 0;phase.children.length > i;i++){
    translate_phase(phase.children[i]);
  }
  return 0;
}

function translate_parameter_map(parameter_map)
{
  for(var key in parameter_map)
  {
    if(parameter_map[key].unique_value == undefined)
    {
      for(var i = 0; i < parameter_map[key].lower_bounds.length; i++)
      {
        parameter_map[key].lower_bounds[i].value = parseValue(parameter_map[key].lower_bounds[i].value);
      }
      for(var i = 0; i < parameter_map[key].upper_bounds.length; i++)
      {
        parameter_map[key].upper_bounds[i].value = parseValue(parameter_map[key].upper_bounds[i].value);
      }
    }else{
      parameter_map[key].unique_value = parseValue(parameter_map[key].unique_value);
    }
  }
}

function makeAxis(range,delta,color){
  var geometry = new THREE.Geometry();
  var material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors })
  var i;
  var start = Math.floor(range.min / delta) * delta;
  var end = range.max;
  // for(i=start; i<=end; i+=delta){
  //   geometry.vertices.push(new THREE.Vector3(-1,0,i), new THREE.Vector3(1,0,i));
  //   geometry.colors.push(color,color);
  // }
  geometry.vertices.push(new THREE.Vector3(0, 0, range.min), new THREE.Vector3(0, 0, range.max));
  geometry.colors.push(color,color);
  var grid_obj = new THREE.Object3D();
  grid_obj.add(new THREE.LineSegments(geometry,material));
  return grid_obj;
};

function apply_parameter_to_expr(expr,parameter_value_list){
  var ret_expr = expr;
  for(var key in parameter_value_list){
    while(ret_expr.indexOf(key,0) != -1){
      ret_expr = ret_expr.replace(key,parameter_value_list[key]);
    }
  }
  return ret_expr;
}


function clearPlot()
{
  graph_scene = new THREE.Scene();
  // TODO: 複数のプロットが存在するときの描画範囲について考える
  // TODO: 設定を変更した時に動的に変更が反映されるようにする
}

function updateAxisScaleLabel( xrange, yrange, zrange)
{
  var canvas = document.getElementById('scaleLabelCanvas');
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if(!plot_settings.scaleLabelVisible)return;
  ctx.font = "20px 'Arial'";

  var scale_interval = calculateScaleInterval(xrange);
  var fixed = calculateNumberOfDigits(scale_interval);
  ctx.fillStyle = xAxisColor;
  var start = Math.floor(xrange.min/scale_interval) * scale_interval;
  
  for(var i = 0; start + i * scale_interval <= xrange.max; i++)
  {
    var current = start + i * scale_interval;
    var pos = toScreenPosition(new THREE.Vector3(current, 0, 0), graph_camera);
    ctx.fillText(current.toFixed(fixed), pos.x, pos.y);
  }
  scale_interval = calculateScaleInterval(yrange);
  fixed = calculateNumberOfDigits(scale_interval);
  ctx.fillStyle = yAxisColor;
  start = Math.floor(yrange.min/scale_interval) * scale_interval;
  for(var i = 0; start + i * scale_interval <= yrange.max; i++)
  {
    var current = start + i * scale_interval
    var pos = toScreenPosition(new THREE.Vector3(0, current, 0), graph_camera);
    ctx.fillText(current.toFixed(fixed), pos.x, pos.y);
  }

  scale_interval = calculateScaleInterval(zrange);
  fixed = calculateNumberOfDigits(scale_interval);
  ctx.fillStyle = zAxisColor;
  start = Math.floor(zrange.min/scale_interval) * scale_interval;
  for(var i = 0; start + i * scale_interval <= zrange.max; i++)
  {
    var current = start + i * scale_interval
    var pos = toScreenPosition(new THREE.Vector3(0, 0, current), graph_camera);
    ctx.fillText(current.toFixed(fixed), pos.x, pos.y);
  }
}

function calculateNumberOfDigits(interval)
{
  var num = Math.floor(Math.log(interval)/Math.log(10));
  num = num > 0?0:-num;
  num = Math.max(num, 0);
  num = Math.min(num, 20);
  return num;
}

function toScreenPosition(pos, camera)
{

  var widthHalf = 0.5*graph_renderer.context.canvas.width;
  var heightHalf = 0.5*graph_renderer.context.canvas.height;

  pos.project(camera);

  pos.x = ( pos.x * widthHalf ) + widthHalf;
  pos.y = - ( pos.y * heightHalf ) + heightHalf;

  return {
    x: pos.x,
    y: pos.y
  };
}

function calculateScaleInterval(range)
{
  var width = range.max - range.min;
  var log = Math.log(width)/Math.log(10);
  var floor = Math.floor(log);
  var fractional_part = log - floor;
  var scale_interval = Math.pow(10, floor)/5;
  var log10_5 = 0.69;
  if(fractional_part > log10_5)scale_interval *= 5;
  if(scale_interval <= 0)return Number.MAX_VALUE;
  return scale_interval;
}


var current_hydat;

function loadHydat(hydat)
{
  try
  {
    browser_storage.setItem("hydat", JSON.stringify(hydat));
    current_hydat = hydat;
    translate(hydat);
    parameter_setting(current_hydat.parameters);
    modifyNameLabel(hydat.name);
  }
  catch(e)
  {
    console.log(e);
    console.log(e.stack);
    showToast("Failed to load hydat: " + e.name + "(" + e.message + ")", 3000, "red darken-4");
  }
  clearPlot();
  initVariableSelector(hydat);
  update_axes(true);
}

function modifyNameLabel(name)
{
  var text = "";
  if(!(name == undefined || name == null))
  {
    text = name;
  }
  var canvas = document.getElementById('nameLabelCanvas');
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px 'Arial'";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, 0, canvas.height - 50);
}

var plotting_mode_switch = document.getElementById("plotting-mode-switch");

function replot_all()
{
  var table = document.getElementById("graph_axis_table");
  for(var i in plot_lines)
  {
    plot_lines[i].color_angle = i/Object.keys(plot_lines).length * 360;
    replot(plot_lines[i]);
  }
  time=0;
}

var plot_animate = [];

function replot(line)
{
  remove_plot(line);
  remove_mesh(plot_animate);
  add_plot(line);
  if(line.settings.x != "" && line.settings.y != "" && line.settings.z != "")
  {
    if(line.remain==undefined){
      settingsForCurrentHydat.plot_line_settings[line.index] = line.settings;
      browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
    }
  }
}

var PlotStartTime;
var array = -1;

function add_plot(line){
  var axes;
  if(line.settings.x == "" ||
     line.settings.y == "" ||
     line.settings.z == "")
  {
    return;
  }
  try
  {
    axes = {
      x : parseValue(line.settings.x),
      y : parseValue(line.settings.y),
      z : parseValue(line.settings.z)
    };
    updateFolder(line, true);
  }catch(e)
  {
    console.log(e);
    console.log(e.stack);
    updateFolder(line, false);
    return;
  }
  var dt = parseFloat(plot_settings.plotInterval);
  var phase = current_hydat.first_phases[0];
  var parameter_condition_list = divideParameter(current_hydat.parameters);
  var color = getColors(parameter_condition_list.length, line.color_angle);
  line.plot_information = {phase_index_array: [{phase:phase, index: 0}], axes:axes, line:line, width:plot_settings.lineWidth, color:color, dt:dt, parameter_condition_list: parameter_condition_list};
  startPreloader();
    array = -1;
    animation_line = [];
    animation_line.maxlen = 0;
  if(line.plot_ready == undefined)requestAnimationFrame(function(){plot_ready(line)});
}


function plot_ready(line)
{
  var plot_information = line.plot_information;
  if(plot_information.line.plotting)
  {
    line.plot_ready = requestAnimationFrame(function(){plot_ready(line)});
  }
  else
  {
    line.plotting = true;
    line.plot_ready = undefined;
    line.last_plot_time = new Date().getTime();
    if(PlotStartTime == undefined)PlotStartTime = new Date().getTime();
    add_plot_each(plot_information.phase_index_array, plot_information.axes, plot_information.line, plot_information.width, plot_information.color, plot_information.dt, plot_information.parameter_condition_list, 0, []);
  }
}

var animation_line = [];
var current_line_vec_animation = [];
var s_geometry;  
var s_material;
var sphere;
var phase_index;
var phase;
var vec;
var vec_animation;
var three_line;

function add_plot_each(phase_index_array, axes, line, width, color, dt, parameter_condition_list, current_param_idx, current_line_vec)
{
  try
  {
    while(true)
    {
      if(line.plot_ready)
      {
        line.plotting = false;
        console.log("Plot is interrupted");
        PlotStartTime = undefined;
        return;
      }

      // phase_index_array is used to implement dfs without function call.
      phase_index = phase_index_array[phase_index_array.length - 1];
      phase = phase_index.phase;
      vec = phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, dt);
      current_line_vec = current_line_vec.concat(vec);
      vec_animation = phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, 0.01);
      current_line_vec_animation = current_line_vec_animation.concat(vec_animation);
      if(phase.children.length == 0)
      {
        array += 1;
        // on leaves
        
        var cylindersGeometry = new THREE.Geometry();
        scaledWidth = 0.5*width/graph_camera.zoom;
        var addCylinder = function(startPos, endPos)
        {
          directionVec = endPos.clone().sub(startPos);
          height = directionVec.length();
          directionVec.normalize();
          var cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(scaledWidth, scaledWidth, height+scaledWidth, 8, 1));

          upVec = new THREE.Vector3(0, 1, 0);
          rotationAxis = upVec.clone().cross(directionVec).normalize();
          rotationAngle = Math.acos(upVec.dot(directionVec));

          newpos = startPos.clone().lerp(endPos, 0.5);
          cylinderMesh.position.set(newpos.x, newpos.y, newpos.z);
          cylinderMesh.setRotationFromAxisAngle(rotationAxis, rotationAngle);

          cylinderMesh.updateMatrix();
          cylindersGeometry.merge(cylinderMesh.geometry, cylinderMesh.matrix);
        };

        dottedLength = 10.0/graph_camera.zoom;
        for(var i = 0; i + 1 < current_line_vec.length; i++)
        {
          if('isPP' in current_line_vec[i + 1])
          {
            posBegin = current_line_vec[i];
            posEnd = current_line_vec[i + 1];
            directionVec = posEnd.clone().sub(posBegin);
            lineLength = directionVec.length();
            directionVec.normalize();
            numOfDots = lineLength / dottedLength;
            for(var j = 1; j + 1 < numOfDots; j += 2)
            {
              addCylinder(
                posBegin.clone().add(directionVec.clone().multiplyScalar(j*dottedLength)),
                posBegin.clone().add(directionVec.clone().multiplyScalar((j+1)*dottedLength))
              );
            }
          }
          else if(!current_line_vec[i].equals(current_line_vec[i + 1]))
          {
            addCylinder(current_line_vec[i], current_line_vec[i + 1]);
          }
        }

        var three_line = new THREE.Mesh(
          cylindersGeometry,
          new THREE.MeshBasicMaterial({color:color[current_param_idx]})
        );
        three_line.isLine = true;
        graph_scene.add(three_line);
        line.plot.push(three_line);

        animation_line[array] = (current_line_vec_animation);
        animation_line[array].color = (color[current_param_idx]);
        if(animation_line.maxlen < current_line_vec_animation.length){
          animation_line.maxlen = current_line_vec_animation.length;
        }
        s_geometry = new THREE.SphereGeometry(0.1);  
        s_material = new THREE.MeshBasicMaterial( { color:color[current_param_idx] } );
        sphere = new THREE.Mesh( s_geometry, s_material );
        sphere.position.set(0,0,0);
        graph_scene.add( sphere );
        plot_animate[array] = (sphere);
        current_line_vec = [];
        current_line_vec_animation = [];
        phase_index_array.pop();
        phase_index = phase_index_array[phase_index_array.length - 1];
        ++(phase_index.index);
        phase = phase_index.phase;
        if (animation_line.length > 4){
          console.log("a");}
      }
      while(true)
      {
        var to_next_child = false;
        // search next child to plot
        for(; phase_index.index < phase.children.length; phase_index.index++)
        {
          var child = phase.children[phase_index.index];
          var included_by_parameter_condition = check_parameter_condition(child.parameter_maps, parameter_condition_list[current_param_idx]);
          if(included_by_parameter_condition){
            phase_index_array.push({phase:child, index:0});
            var current_time = new Date().getTime();
            if(current_time - line.last_plot_time >= 200)
            {
              line.last_plot_time = current_time;
              // use setTimeout to check event queue
              requestAnimationFrame(function()
                         {add_plot_each(phase_index_array, axes, line, width, color, dt, parameter_condition_list, current_param_idx, current_line_vec)
                         });
              return;
            }
            else to_next_child = true;
            break;
          }
        }
        if(to_next_child)break;


        // Plot for this current_param_idx is completed.
        if(phase_index_array.length == 1)
        {
          ++current_param_idx;
          if(current_param_idx >= parameter_condition_list.length)
          {
            // Plot is completed.
            line.plotting = false;
            checkAndStopPreloader();
            return;
          }
          else
          {
            // setTimeout(function()
            //             {add_plot_each([{phase:phase_index_array[0].phase, index:0}], axes, line, width, color, dt, parameter_condition_list, current_param_idx, [])
            //             }, 0);
            phase_index_array[0].index = 0;
            break;
          }
        }else
        {
          // go to parent phase
          phase_index_array.pop();
          phase_index = phase_index_array[phase_index_array.length - 1];
          ++(phase_index.index);
          phase = phase_index.phase;
        }
      }
    }
  }
  catch(ex)
  {
    console.log(ex);
    console.log(ex.stack);
    showToast("Plot failed: " + ex.name +
                      "(" + ex.message + ")", 3000, "red darken-4");
    line.plotting = false;
    checkAndStopPreloader();
  }
}


function divideParameter(parameter_map){

  var now_parameter_condition_list = [{}];

  for(parameter_name in parameter_map){
    var setting = plot_settings.parameter_condition[parameter_name];
    if(setting.fixed)
    {
      for(var i=0; i<now_parameter_condition_list.length; i++){
        var parameter_value = setting.value;
        now_parameter_condition_list[i][parameter_name] = new Constant(parseFloat(parameter_value));
      }
    }else
    {
      var lb = setting.min_value;
      var ub = setting.max_value;
      var div = parseInt(setting.value);
      var next_parameter_condition_list = [];
      var deltaP;
      if(div == 1){deltaP = ub - lb;}
      else{deltaP = (ub - lb) / (div - 1);}
      for(var i=0; i<now_parameter_condition_list.length; i++){
        for(var j=0; j<div ; j++){
          var parameter_value = lb + j*deltaP;
          tmp_obj = $.extend(true, {}, now_parameter_condition_list[i]);  // deep copy
          tmp_obj[parameter_name] = new Constant(parameter_value);
          next_parameter_condition_list.push(tmp_obj);
        }
      }
      now_parameter_condition_list = next_parameter_condition_list;
    }
  }
  return now_parameter_condition_list;
}

function getColors(colorNum, colorAngle){
  var angle = 360 / colorNum;
  var angle_start = Math.floor(colorAngle);
  var retColors = [];
  for(var i = 0; i < colorNum; i++){
    retColors.push(hue2rgb((Math.floor(angle * i) + angle_start)%360));
  }
  return retColors;
}

function hue2rgb(h){
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
  r = Math.floor(255*r);
  g = Math.floor(255*g);
  b = Math.floor(255*b);
  return (r << 16) + (g << 8) + b;
}



function phase_to_line_vectors(phase,parameter_condition_list,axis,maxDeltaT){
  var line = [];
  var t;
  if(phase.simulation_state != "SIMULATED" && phase.simulation_state != "TIME_LIMIT" && phase.simulation_state != "STEP_LIMIT") return line;

  var env = {};
  $.extend(env, parameter_condition_list, phase.variable_map);

  if(phase.type=="PP"){
    env.t = phase.time.time_point;
    newPos = new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env));
    newPos.isPP = true;
    line.push(newPos);
  }else{
    var start_time = phase.time.start_time.getValue(env);
    var end_time = phase.time.end_time.getValue(env);
    if(!Number.isFinite(start_time) || !Number.isFinite(end_time))throw new HydatException("invalid time interval: from" + phase.time.start_time + " to " + phase.time.end_time);
    var MIN_STEP = 10; // Minimum step of plotting one IP
    var delta_t = Math.min(maxDeltaT, (end_time - start_time)/MIN_STEP);
    for(t = start_time; t < end_time; t = t + delta_t){
      env.t = new Constant(t);
      line.push(new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)));
    }
    env.t = new Constant(end_time);
    line.push(new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)));
  }
  return line;
}

function vector3_to_geometry(vector3_list){
  var geometry = new THREE.Geometry();
  for(var i = 0; i < vector3_list.length; i++)
  {
    geometry.vertices.push(vector3_list[i]);
  }
  return geometry;
}


function check_parameter_condition(parameter_maps,parameter_condition_list){
  var epsilon = 0.0001;
  for(var i = 0; i < parameter_maps.length; i++)
  {
    var included = true;
    for(var key in parameter_maps[i]){
      if(parameter_condition_list[key] === undefined)continue;
      if(typeof parameter_maps[i][key].unique_value ===  'undefined'){
        var lb = parameter_maps[i][key].lower_bounds[0].value.getValue(parameter_condition_list);
        var ub = parameter_maps[i][key].upper_bounds[0].value.getValue(parameter_condition_list);
        if(!(lb <= parameter_condition_list[key].getValue(parameter_condition_list) + epsilon
           && ub >= parameter_condition_list[key].getValue(parameter_condition_list) - epsilon)){
          included = false;
        }
      }else if(!(parameter_maps[i][key].unique_value.getValue(parameter_condition_list) <= parameter_condition_list[key].getValue(parameter_condition_list) + epsilon
               && parameter_maps[i][key].unique_value.getValue(parameter_condition_list) >= parameter_condition_list[key].getValue(parameter_condition_list) - epsilon)){
        included = false;
      }
    }
    if(included){
      return true;
    }
  }
  return false;
}

function checkAndStopPreloader()
{
  var table = document.getElementById("graph_axis_table");
  for(var i in plot_lines)
  {
    if(plot_lines[i].plotting || plot_lines[i].ready != undefined)
    {
      return;
    }
  }
  var current_time = new Date().getTime();
  if(PlotStartTime == undefined || current_time - PlotStartTime >= 1000)
  {
    showToast("Plot finished.", 1000, "blue");
  }
  PlotStartTime = undefined;
  graph_renderer.render(graph_scene, graph_camera);
  stopPreloader();
}

function remove_plot(line){
  if(line.plot != undefined)
  {
    for(var i=0; i<line.plot.length; i++){
      graph_scene.remove(line.plot[i]);
    }
    delete line.plot[i];
  }
  line.plot = [];
}
function remove_mesh(line){
  if(line != undefined)
  {
    for(var i=0; i<line.length; i++){
      graph_scene.remove(line[i]);
      delete line[i];
    }
  }
  line.length = 0;
}



function toUnitVector(vector)
{
  var unit_vector;
  var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  unit_vector.x = vector.x / length;
  unit_vector.y = vector.y / length;
  unit_vector.z = vector.z / length;
  return unit_vector;
}

function expandFrustum(orig, epsilon)
{
  var expanded = orig.clone();
  expandTwoPlanesOfFrustum(expanded.planes[0], expanded.planes[1]);
  expandTwoPlanesOfFrustum(expanded.planes[2], expanded.planes[3]);
  expandTwoPlanesOfFrustum(expanded.planes[4], expanded.planes[5]);
  return expanded;
}


function expandTwoPlanesOfFrustum(plane1, plane2)
{
  var dot = plane1.normal.dot(plane2.normal);
  var rate = 1.1;
  
  if(dot * plane1.constant * plane2.constant > 0)
  {
    if(Math.abs(plane1.constant) > Math.abs(plane2.constant) )
    {
      plane1.constant *= rate;
      plane2.constant /= rate;
    }
    else
    {
      plane1.constant /= rate;
      plane2.constant *= rate;
    }
  }
  else
  {
    plane1.constant *= rate;
    plane2.constant *= rate;
  }
  return;
}

function getRangeOfFrustum(camera){
  var xmin, ymin, zmin;
  xmin = ymin = zmin = Number.MAX_VALUE;
  var xmax, ymax, zmax;
  xmax = ymax = zmax = Number.MIN_VALUE;

  // Near Plane dimensions
  var hNear = (camera.top - camera.bottom)/camera.zoom;
  var wNear = (camera.right - camera.left)/camera.zoom;

  // Far Plane dimensions
  var hFar = hNear;
  var wFar = wNear;

  var p = camera.position.clone();
  var l = graph_controls.target.clone();
  var u = new THREE.Vector3(0, 1, 0);

  var d = new THREE.Vector3();
  d.subVectors(l, p);
  d.normalize();

  var cross_d = u.clone();
  cross_d.cross(d);
  var rotate_axis = cross_d.clone();
  rotate_axis.normalize();
  var dot = u.dot(d);
  u.applyAxisAngle(rotate_axis, Math.acos(dot) - Math.PI / 2);

  var r = new THREE.Vector3();
  r.crossVectors(u, d);
  r.normalize();

  // Near Plane center
  var dTmp = d.clone();
  var nc = new THREE.Vector3();
  nc.addVectors(p, dTmp.multiplyScalar(camera.near));

  // Near Plane vertices
  var uTmp = u.clone();
  var rTmp = r.clone();
  var ntr = new THREE.Vector3();
  ntr.addVectors(nc, uTmp.multiplyScalar(hNear / 2));
  ntr.sub(rTmp.multiplyScalar(wNear / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  var ntl = new THREE.Vector3();
  ntl.addVectors(nc, uTmp.multiplyScalar(hNear / 2));
  ntl.add(rTmp.multiplyScalar(wNear / 2));

  var nbr = new THREE.Vector3();
  uTmp.copy(u);
  rTmp.copy(r);
  nbr.subVectors(nc, uTmp.multiplyScalar(hNear / 2));
  nbr.sub(rTmp.multiplyScalar(wNear / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  var nbl = new THREE.Vector3();
  nbl.subVectors(nc, uTmp.multiplyScalar(hNear / 2));
  nbl.add(rTmp.multiplyScalar(wNear / 2));


  // Far Plane center
  dTmp.copy(d);
  var fc = new THREE.Vector3();
  fc.addVectors(p, dTmp.multiplyScalar(camera.far));

  // Far Plane vertices
  uTmp.copy(u);
  rTmp.copy(r);
  var ftr = new THREE.Vector3();
  ftr.addVectors(fc, uTmp.multiplyScalar(hFar / 2));
  ftr.sub(rTmp.multiplyScalar(wFar / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  var ftl = new THREE.Vector3();
  ftl.addVectors(fc, uTmp.multiplyScalar(hFar / 2));
  ftl.add(rTmp.multiplyScalar(wFar / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  var fbr = new THREE.Vector3();
  fbr.subVectors(fc, uTmp.multiplyScalar(hFar / 2));
  fbr.sub(rTmp.multiplyScalar(wFar / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  var fbl = new THREE.Vector3();
  fbl.subVectors(fc, uTmp.multiplyScalar(hFar / 2));
  fbl.add(rTmp.multiplyScalar(wFar / 2));

  graph_camera.updateMatrix(); // make sure camera's local matrix is updated
  graph_camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  graph_camera.matrixWorldInverse.getInverse( graph_camera.matrixWorld );

  var frustum = new THREE.Frustum();
  var expansion_rate = 1.2; // to absorb the error caused by floating point arithmetic
  frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( graph_camera.projectionMatrix, graph_camera.matrixWorldInverse ) );
  frustum = expandFrustum(frustum);
  var intercepts = new Array(4);
  // top surface
  intercepts[0] = calculate_intercept(ntr, ftr, ftl, ntl, frustum);
  // right surface
  intercepts[1] = calculate_intercept(ntr, nbr, fbr, ftr, frustum);
  // bottom surface
  intercepts[2] = calculate_intercept(nbr, nbl, fbl, fbr, frustum);
  // left surface
  intercepts[3] = calculate_intercept(ntl, nbl, fbl, ftl, frustum);
  // near surface 
  intercepts[4] = calculate_intercept(ntl, ntr, nbr, nbl, frustum);
  // far surface 
  intercepts[5] = calculate_intercept(ftl, ftr, fbr, fbl, frustum);

  
  var i;
  var epsilon = 0.00000001;
  var visible_x = Math.abs(d.y) + Math.abs(d.z) > epsilon,
      visible_y = Math.abs(d.z) + Math.abs(d.x) > epsilon,
      visible_z = Math.abs(d.x) + Math.abs(d.y) > epsilon;
  for(i = 0; i < intercepts.length; i++)
  {
    if(visible_x && !isNaN(intercepts[i].x))xmin = Math.min(xmin, intercepts[i].x);
    if(visible_y && !isNaN(intercepts[i].y))ymin = Math.min(ymin, intercepts[i].y);
    if(visible_z && !isNaN(intercepts[i].z))zmin = Math.min(zmin, intercepts[i].z);
    if(visible_x && !isNaN(intercepts[i].x))xmax = Math.max(xmax, intercepts[i].x);
    if(visible_y && !isNaN(intercepts[i].y))ymax = Math.max(ymax, intercepts[i].y);
    if(visible_z && !isNaN(intercepts[i].z))zmax = Math.max(zmax, intercepts[i].z);
  }
  return {xmin:xmin, ymin:ymin, zmin:zmin, xmax: xmax, ymax:ymax, zmax:zmax};
}

/// calculate cross point of the plane and three axes(x, y, z).
/// The plane is defined by point_a, point_b, point_c and point_d.(The forth parameter is required to determine the range of the plane.)
function calculate_intercept(point_a, point_b, point_c, point_d, frustum)
{
  var ab_vec = new THREE.Vector3().subVectors(point_b, point_a);
  var ac_vec = new THREE.Vector3().subVectors(point_c, point_a);
  var cross_product = ab_vec.clone().cross(ac_vec);
  var ret = new THREE.Vector3();
  var sum = cross_product.x * point_a.x + cross_product.y * point_a.y + cross_product.z * point_a.z;
  if(cross_product.x == 0)ret.x = 0;
  else   ret.x = sum / cross_product.x;
  if(cross_product.y == 0)ret.y = 0;
  else   ret.y = sum / cross_product.y;
  if(cross_product.z == 0)ret.z = 0;
  else   ret.z = sum / cross_product.z;



  if(!frustum.containsPoint(new THREE.Vector3(ret.x, 0, 0)))ret.x = Number.NaN;
  if(!frustum.containsPoint(new THREE.Vector3(0, ret.y, 0)))ret.y = Number.NaN;
  if(!frustum.containsPoint(new THREE.Vector3(0, 0, ret.z)))ret.z = Number.NaN;
  return ret;
}

var xAxisLine, yAxisLine, zAxisLine, prev_range;

var xAxisColorBase = {r:1.0, g:0.3, b: 0.3};
var yAxisColorBase = {r:0.3, g:1.0, b: 0.3};
var zAxisColorBase = {r:0.3, g:0.3, b: 1.0};
var xAxisColor = "#FF8080";
var yAxisColor = "#80FF80";
var zAxisColor = "#8080FF";

function update_axes(force:boolean){
  var range = getRangeOfFrustum(graph_camera);
  var xrange = {min:range.xmin, max: range.xmax};
  var yrange = {min:range.ymin, max: range.ymax};
  var zrange = {min:range.zmin, max: range.zmax};
  if(force == true || prev_range == undefined
     || range.xmin != prev_range.xmin
     || range.xmax != prev_range.xmax
     || range.ymin != prev_range.ymin
     || range.ymax != prev_range.ymax
     || range.zmin != prev_range.zmin
     || range.zmax != prev_range.zmax)
  {
    var margin_rate = 1.1;

    var max_interval_px = 200; // 50 px
    var min_visible_ticks = Math.floor(Math.max(graph_area.clientWidth, graph_area.clientHeight)/max_interval_px);
    var min_visible_range = Math.min(xrange.max - xrange.min, yrange.max - yrange.min);
    min_visible_range = Math.min(min_visible_range, zrange.max - zrange.min);
    var max_interval = min_visible_range / min_visible_ticks;

    if(xAxisLine !== undefined)
    {
      graph_scene.remove(xAxisLine);
      graph_scene.remove(yAxisLine);
      graph_scene.remove(zAxisLine);
    }
    var interval = Math.pow(10, Math.floor(Math.log(max_interval)/Math.log(10)));
    interval = 1;
    xAxisLine = makeAxis(xrange, interval, new THREE.Color(xAxisColor));
    yAxisLine = makeAxis(yrange, interval, new THREE.Color(yAxisColor));
    zAxisLine = makeAxis(zrange, interval, new THREE.Color(zAxisColor));
    xAxisLine.rotation.set(0, Math.PI/2, Math.PI/2);
    yAxisLine.rotation.set(-Math.PI/2, 0, -Math.PI/2);
    graph_scene.add(xAxisLine);
    graph_scene.add(yAxisLine);
    graph_scene.add(zAxisLine);
    render_three_js();
  }
  updateAxisScaleLabel(xrange, yrange, zrange);
  prev_range = range;
}

var arr = 0;
var time_prev = -100;
function animate(){
  if(time_prev != time){
    plot_animate = [];
    arr = 0;
    for (i=0; i<graph_scene.children.length-1; i++){
      if('isLine' in graph_scene.children[i])
      {
        if(animation_line[arr] == undefined){
          continue;
        }
        if(time>animation_line.maxlen-1){
          time = 0;
        }
        if(time == 0){
          graph_scene.children[i+1].material.color.set(
            animation_line[arr].color
          );
        }
        if(time>animation_line[arr].length-1){
          graph_scene.children[i+1].material.color.set(
            198,
            198,
            198
          );
          plot_animate[arr] = (graph_scene.children[i+1]);
          arr += 1;
          continue;
        }
        graph_scene.children[i+1].position.set(
          animation_line[arr][time].x,
          animation_line[arr][time].y,
          animation_line[arr][time].z);
          plot_animate[arr] = (graph_scene.children[i+1]);
          arr += 1;
      }
    }
    time_prev = time;
    render_three_js();
  }
}

function animate_time(){
  time++;
}



function guard(){
  g_geometry = new THREE.PlaneGeometry(100,100,100,100);
  g_material = new THREE.MeshBasicMaterial( { color: 0x0000ff
                                              ,wireframe: true
                                            } );
  guard = new THREE.Mesh( g_geometry, g_material );
  guard.position.set(0,0,0);
  //guard.rotation.set(0, Math.PI/2, Math.PI/2);//y
  guard.rotation.set(-Math.PI/2, 0, -Math.PI/2);
  graph_scene.add( guard );
}


var face_all;
var face_a;
function range_make_all(){
  if(face_a!=undefined){
    remove_mesh(face_a);
  }
  face_a = [];
  var arr_face = 0;
  if(animation_line.length!=0){
    for (j=0; j < animation_line.length-1; j++){
      var face_geometry = new THREE.Geometry();
      var time_r=0;
      for (i=0;i < animation_line.maxlen; i++){
        if(animation_line[j][time_r] == undefined){
          break;
        }else if(animation_line[j+1][time_r] == undefined){
          break;
        }else{
          face_geometry.vertices.push(new THREE.Vector3(animation_line[j][time_r].x, animation_line[j][time_r].y, animation_line[j][time_r].z));
          face_geometry.vertices.push(new THREE.Vector3(animation_line[j+1][time_r].x, animation_line[j+1][time_r].y, animation_line[j+1][time_r].z));
        }
        time_r++;
      }
      for(k=0;k<face_geometry.vertices.length-2;k++){
        face_geometry.faces.push(new THREE.Face3(k,(k+1),(k+2)));
      }
      face_geometry.computeFaceNormals();
      face_geometry.computeVertexNormals();
      face_all = new THREE.Mesh(face_geometry, new THREE.MeshBasicMaterial({color:0xffffff,depthTest:true,transparent:true,side: THREE.DoubleSide,opacity : 0.5}));
      graph_scene.add( face_all );
      face_a[arr_face] = (face_all);
      arr_face++;
    }
    render_three_js();
  }
}

function setBackgroundColor(color)
{
  var color_val = parseInt("0x" + color.substr(1));
  var b = color_val % 256;
  color_val /= 256;
  var g = color_val % 256;
  color_val /= 256;
  var r = color_val;
  var brightness = Math.min(255, 256 - Math.max(r, g, b));
  xAxisColor = calculateColorWithBrightness(xAxisColorBase, brightness);
  yAxisColor = calculateColorWithBrightness(yAxisColorBase, brightness);
  zAxisColor = calculateColorWithBrightness(zAxisColorBase, brightness);
  graph_renderer.setClearColor(color);
  update_axes(true);
}


function calculateColorWithBrightness(base, brightness)
{
  return "#" + ("00" + Math.floor(base.r * brightness).toString(16)).slice(-2)
    + ("00" + Math.floor(base.g * brightness).toString(16)).slice(-2)
    + ("00" + Math.floor(base.b * brightness).toString(16)).slice(-2);
}
