import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Graph{
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  elem: HTMLElement;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  time: number = 0;
  animatable: boolean = true;
  rangemode: boolean = false;

  controls_position0:THREE.Vector3;

  a_line = 1;
  t_line = 0;
  last_frame_zoom = 1;

  constructor(){
    this.scene = new THREE.Scene();
  
    // PerspectiveCamera
    // camera = new THREE.PerspectiveCamera(75, 600 / 400, 1, 1000);
    const width = 50;
    const height = 50;

    // OrthographicCamera
    const left   = width / -2;
    const right  = width / 2;
    const top    = height / 2;
    const bottom = height / -2;
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, -1000, 1000);
  
    this.camera.position.set(0, 0, 100);
    this.elem = document.getElementById("graph-area");
    this.renderer = new THREE.WebGLRenderer({antialias: true});
  
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.elem.appendChild(this.renderer.domElement);
  
    let directionalLight = new THREE.DirectionalLight('#ffffff', 1);
    directionalLight.position.set(0, 7, 10);
  
    this.scene.add(directionalLight);
  
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls_position0 = this.controls.object.position.clone();
  }

  resizeGraphRenderer(){
    if(this.elem.clientWidth > 0 && this.elem.clientHeight > 0)
    {
      this.renderer.setSize(this.elem.clientWidth, this.elem.clientHeight);
      // this.camera.aspect = this.elem.clientWidth / this.elem.clientHeight;
      var prev_width = this.camera.right - this.camera.left;
      var prev_height = this.camera.top - this.camera.bottom;
      var extend_rate;
      if(prev_width != this.camera.right - this.camera.left) extend_rate = this.elem.clientWidth / prev_width;
      else extend_rate = this.elem.clientHeight / prev_height;
  
      this.camera.left = -this.elem.clientWidth / 2;
      this.camera.right = this.elem.clientWidth / 2;
      this.camera.top = this.elem.clientHeight / 2;
      this.camera.bottom = -this.elem.clientHeight / 2;
      this.camera.zoom *= extend_rate;
  
      this.camera.updateProjectionMatrix();
  
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

  render() {
    requestAnimationFrame(()=>{this.render()});
    this.controls.update();
    if(this.last_frame_zoom != this.camera.zoom){
      replot_all();
    }
    update_axes(false);
    if(this.animatable){
      animate(); // animating function
      animate_time();
    }else{
      animate();
    }
    if(animation_line.length != this.a_line){
      if(range_mode){ range_make_all();}
      this.a_line = animation_line.length;
    }
    if(animation_line.maxlen != this.t_line){
      this.t_line = animation_line.maxlen;
      parameter_seek_setting(this.t_line);
    }else if(this.animatable){
      parameter_seek_setting_animate(this.t_line, this.time);
    }
    this.last_frame_zoom = this.camera.zoom;
  }
  
  render_three_js()
  {
    this.renderer.render(this.scene, this.camera);
  }
}
