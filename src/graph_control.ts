import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PlotLineMapControl } from './plot_line_map_control';
import { DatGUIControl } from './dat_gui_control';

export class GraphControl {
  static scene: THREE.Scene;
  static camera: THREE.OrthographicCamera;
  static elem: HTMLElement;
  static controls: OrbitControls;
  static renderer: THREE.WebGLRenderer;
  static time: number = 0;
  static time_prev: number = -100;
  static animatable: boolean = true;
  static rangemode: boolean = false;

  static controls_position0: THREE.Vector3;

  static a_line = 1;
  static t_line = 0;
  static last_frame_zoom = 1;

  static resizeLoopCount: number = 0;

  static init() {
    this.scene = new THREE.Scene();

    // PerspectiveCamera
    // camera = new THREE.PerspectiveCamera(75, 600 / 400, 1, 1000);
    const width = 50;
    const height = 50;

    // OrthographicCamera
    const left = width / -2;
    const right = width / 2;
    const top = height / 2;
    const bottom = height / -2;
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, -1000, 1000);

    this.camera.position.set(0, 0, 100);
    this.elem = document.getElementById("graph-area");
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.elem.appendChild(this.renderer.domElement);

    let directionalLight = new THREE.DirectionalLight('#ffffff', 1);
    directionalLight.position.set(0, 7, 10);

    this.scene.add(directionalLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls_position0 = this.controls.object.position.clone();

    //TODO: implement this in more elegant way
    setTimeout(() => { this.resizeGraphRenderer() }, 200);
  }

  static resizeGraphRenderer() {
    if (this.elem.clientWidth > 0 && this.elem.clientHeight > 0) {
      this.renderer.setSize(this.elem.clientWidth, this.elem.clientHeight);
      // this.camera.aspect = this.elem.clientWidth / this.elem.clientHeight;
      var prev_width = this.camera.right - this.camera.left;
      var prev_height = this.camera.top - this.camera.bottom;
      var extend_rate;
      if (prev_width != this.camera.right - this.camera.left) extend_rate = this.elem.clientWidth / prev_width;
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

  static render() {
    requestAnimationFrame(() => { this.render() });
    this.controls.update();
    if (this.last_frame_zoom !== this.camera.zoom) {
      GraphControl.replotAll();
    }
    update_axes(false);
    if (this.animatable) {
      GraphControl.animate(); // animating function
      animate_time();
    } else {
      GraphControl.animate();
    }
    if (animation_line.length != this.a_line) {
      if (range_mode) { range_make_all(); }
      this.a_line = animation_line.length;
    }
    if (animation_line.maxlen != this.t_line) {
      this.t_line = animation_line.maxlen;
      DatGUIControl.parameter_seek_setting(this.t_line);
    } else if (this.animatable) {
      DatGUIControl.parameter_seek_setting_animate(this.t_line, this.time);
    }
    this.last_frame_zoom = this.camera.zoom;
  }

  static render_three_js() {
    this.renderer.render(this.scene, this.camera);
  }

  static animate() {
    if (this.time_prev !== this.time) {
      plot_animate = [];
      let arr = 0;
      for (let i = 0; i < this.scene.children.length - 1; i++) {
        if ('isLine' in this.scene.children[i]) {
          if (animation_line[arr] === undefined) {
            continue;
          }
          if (this.time > animation_line.maxlen - 1) {
            this.time = 0;
          }
          if (this.time == 0) {
            this.scene.children[i + 1].material.color.set(
              animation_line[arr].color
            );
          }
          if (this.time > animation_line[arr].length - 1) {
            this.scene.children[i + 1].material.color.set(
              198,
              198,
              198
            );
            plot_animate[arr] = (this.scene.children[i + 1]);
            arr++;
            continue;
          }
          this.scene.children[i + 1].position.set(
            animation_line[arr][this.time].x,
            animation_line[arr][this.time].y,
            animation_line[arr][this.time].z);
          plot_animate[arr] = (this.scene.children[i + 1]);
          arr += 1;
        }
      }
      GraphControl.time_prev = this.time;
      GraphControl.render_three_js();
    }
  }

  static animateTime() {
    this.time++;
  }

  static toScreenPosition(pos: THREE.Vector3) {
    const widthHalf = 0.5 * this.renderer.context.canvas.width;
    const heightHalf = 0.5 * this.renderer.context.canvas.height;

    pos.project(this.camera);

    return {
      x: (pos.x * widthHalf) + widthHalf,
      y: - (pos.y * heightHalf) + heightHalf
    };
  }

  static updateRotate(autoRotate: boolean) {
    this.controls.autoRotate = autoRotate;
  }

  static update2DMode(twoDimensional: boolean) {
    this.controls.enableRotate = !twoDimensional;
    if (twoDimensional) {
      this.camera.position.copy(this.controls_position0.clone());
      this.controls.target.set(0, 0, 0);
      this.camera.updateMatrix(); // make sure camera's local matrix is updated
      this.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
    }
  }

  static startResizingGraphArea() {
    this.resizeLoopCount = 0;
    setTimeout(() => { this.resizeGraphArea();}, 10);
  }

  static resizeGraphArea() {
    this.resizeLoopCount++;
    this.resizeGraphRenderer();
    //TODO: do this without timer
    if (this.resizeLoopCount < 80) setTimeout(() => { this.resizeGraphArea(); }, 10);
  }

  static clearPlot() {
    this.scene = new THREE.Scene();
    // TODO: 複数のプロットが存在するときの描画範囲について考える
    // TODO: 設定を変更した時に動的に変更が反映されるようにする
  }

  static updateAxisScaleLabel(ranges: ComparableTriplet<Range>) {
    var canvas = <HTMLCanvasElement>document.getElementById('scaleLabelCanvas');
    if (!canvas || !canvas.getContext) {
      return false;
    }

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!plot_settings.scaleLabelVisible) return;
    ctx.font = "20px 'Arial'";

    const sub = (range: Range, axisColor: string, embedFunc: (arg: number) => THREE.Vector3) => {
      let scale_interval = calculateScaleInterval(range);
      let fixed = calculateNumberOfDigits(scale_interval);
      ctx.fillStyle = axisColor;
      let start = Math.floor(range.min / scale_interval) * scale_interval;

      for (let i = 0; start + i * scale_interval <= range.max; i++) {
        const current = start + i * scale_interval;
        const vec = embedFunc(current);
        const pos = graph.toScreenPosition(vec);
        ctx.fillText(current.toFixed(fixed), pos.x, pos.y);
      }
    }

    sub(ranges.x, axisColors.x, (arg) => new THREE.Vector3(arg, 0, 0));
    sub(ranges.y, axisColors.y, (arg) => new THREE.Vector3(0, arg, 0));
    sub(ranges.z, axisColors.z, (arg) => new THREE.Vector3(0, 0, arg));
  }

  static replotAll() {
    PlotLineMapControl.replot();
    this.time = 0;
  }
}
