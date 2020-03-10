import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import $ from 'jquery';

var graph_scene;
var graph_camera;
var graph_area;
var graph_controls;
var graph_renderer;
var time=0;
var animatable=true;
var range_mode=false;

window.addEventListener("DOMContentLoaded", init);

function init(){
  graph_scene = new THREE.Scene();

  // PerspectiveCamera
  // graph_camera = new THREE.PerspectiveCamera(75, 600 / 400, 1, 1000);

  var width = 50;
  var height = 50;
  // OrthographicCamera
  var left   = width / -2;
  var right  = width / 2;
  var top    = height / 2;
  var bottom = height / -2;
  graph_camera = new THREE.OrthographicCamera(left, right, top, bottom, -1000, 1000);

  graph_camera.position.set(0, 0, 100);
  graph_area = document.getElementById("graph-area");
  graph_renderer = new THREE.WebGLRenderer({antialias: true});

  graph_renderer.domElement.style.position = 'absolute';
  graph_renderer.domElement.style.width = '100%';
  graph_renderer.domElement.style.height = '100%';



  graph_area.appendChild(graph_renderer.domElement);

  var directionalLight = new THREE.DirectionalLight('#ffffff', 1);
  directionalLight.position.set(0, 7, 10);

  graph_scene.add(directionalLight);

  graph_controls = new OrbitControls(graph_camera, graph_renderer.domElement);
}

function resizeGraphRenderer(){
  if(graph_area.clientWidth > 0 && graph_area.clientHeight > 0)
  {
    graph_renderer.setSize(graph_area.clientWidth, graph_area.clientHeight);
    graph_camera.aspect = graph_area.clientWidth / graph_area.clientHeight;
    var prev_width = graph_camera.right - graph_camera.left;
    var prev_height = graph_camera.top - graph_camera.bottom;
    var extend_rate;
    if(prev_width != graph_camera.right - graph_camera.left) extend_rate = graph_area.clientWidth / prev_width;
    else extend_rate = graph_area.clientHeight / prev_height;

    graph_camera.left = -graph_area.clientWidth / 2;
    graph_camera.right = graph_area.clientWidth / 2;
    graph_camera.top = graph_area.clientHeight / 2;
    graph_camera.bottom = -graph_area.clientHeight / 2;
    graph_camera.zoom *= extend_rate;

	  graph_camera.updateProjectionMatrix();

    var w = $('#scale_label_wrapper').width();
    var h = $('#scale_label_wrapper').height();
    $('#scaleLabelCanvas').attr('width', w);
    $('#scaleLabelCanvas').attr('height', h);
    update_axes(true);

    $('#nameLabelCanvas').attr('width', w);
    $('#nameLabelCanvas').attr('height', h);
    modifyNameLabel(current_hydat.name);
  }
}

$(window).resize(function() {
  resizeGraphRenderer();
});

var cnt = 0;
var range = 0;
var a_line = 1;
var t_line = 0;
var last_frame_zoom = 1;
function render() {
  requestAnimationFrame(render);
  graph_controls.update();
  if(last_frame_zoom != graph_camera.zoom){
    replot_all();
  }
  update_axes();
  if(animatable){
    animate(); // animating function
    animate_time();
  }else{
    animate();
  }
  if(animation_line.length != a_line){
    if(range_mode){ range_make_all();}
    a_line = animation_line.length;
  }
  if(animation_line.maxlen != t_line){
    t_line = animation_line.maxlen;
    parameter_seek_setting(t_line);
  }else if(animatable){
    parameter_seek_setting_animate(t_line, time);
  }
  last_frame_zoom = graph_camera.zoom;
}


function render_three_js()
{
  graph_renderer.render(graph_scene, graph_camera);
}
