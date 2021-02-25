import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { replotLines } from './plot_line_map_control';
import { parameterSeekSetting, parameterSeekSettingAnimate } from './dat_gui_control';
import { HydatControl } from './hydat_control';
import { animate, animateTime, animationControlState, getLength, makeRanges } from './animation_control';
import { updateAxes } from './plot_control';

/**
 * 描画，再描画，クリアなどを行う<br>
 * いわゆるView
 */

class GraphControl {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  elem: HTMLElement;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  animatable = true;
  rangeMode = false;

  controlsPosition0: THREE.Vector3;

  aLine = 1;
  tLine = 0;
  lastFrameZoom = 1;

  resizeLoopCount = 0;

  constructor() {
    this.scene = new THREE.Scene();

    // PerspectiveCamera
    const width = 50;
    const height = 50;

    // OrthographicCamera
    const left = width / -2;
    const right = width / 2;
    const top = height / 2;
    const bottom = height / -2;
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, -1000, 1000);

    this.camera.position.set(0, 0, 100);
    this.controlsPosition0 = new THREE.Vector3(0, 0, 100);

    this.elem = document.getElementById('graph-area')!;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.elem.appendChild(this.renderer.domElement);

    const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
    directionalLight.position.set(0, 7, 10);

    this.scene.add(directionalLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = true;

    //TODO: implement this in more elegant way
    setTimeout(() => {
      resizeGraphRenderer();
    }, 200);
  }
}

export const graphControl = new GraphControl();

export function resizeGraphRenderer() {
  /**
   * ウィンドウサイズを変更した際, 座標空間も同様に拡大/縮小されるようにカメラ位置の調整等を行う
   */

  if (graphControl.elem.clientWidth > 0 && graphControl.elem.clientHeight > 0) {
    graphControl.renderer.setSize(graphControl.elem.clientWidth, graphControl.elem.clientHeight);
    const prevWidth = graphControl.camera.right - graphControl.camera.left;
    const prevHeight = graphControl.camera.top - graphControl.camera.bottom;
    let extendRate;
    if (prevWidth != graphControl.elem.clientWidth) extendRate = graphControl.elem.clientWidth / prevWidth;
    else extendRate = graphControl.elem.clientHeight / prevHeight;

    graphControl.camera.left = -graphControl.elem.clientWidth / 2;
    graphControl.camera.right = graphControl.elem.clientWidth / 2;
    graphControl.camera.top = graphControl.elem.clientHeight / 2;
    graphControl.camera.bottom = -graphControl.elem.clientHeight / 2;

    graphControl.camera.zoom *= extendRate;

    graphControl.camera.updateProjectionMatrix();

    const w = $('#scale_label_wrapper').width()!;
    const h = $('#scale_label_wrapper').height()!;
    $('#scaleLabelCanvas').attr('width', w);
    $('#scaleLabelCanvas').attr('height', h);
    updateAxes(true);

    $('#nameLabelCanvas').attr('width', w);
    $('#nameLabelCanvas').attr('height', h);
    modifyNameLabel(HydatControl.currentHydat?.name);
  }
}

export function modifyNameLabel(name: string | undefined) {
  /**
   * 座標画面の左下部に現在動かしているファイル名を表示（open controls に隠れる位置）
   */
  let text = '';
  if (!(name == undefined || name == null)) {
    text = name;
  }
  const canvas = <HTMLCanvasElement>document.getElementById('nameLabelCanvas');
  if (!canvas || !canvas.getContext) {
    return false;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "20px 'Arial'";
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, 0, canvas.height - 50);
}
export function renderGraph() {
  requestAnimationFrame(() => {
    renderGraph();
  });
  graphControl.controls.update();
  if (graphControl.lastFrameZoom !== graphControl.camera.zoom) {
    replotAll();
  }
  updateAxes(false);
  if (graphControl.animatable) {
    animate(); // animating function
    animateTime();
  } else {
    animate();
  }
  if (getLength() !== graphControl.aLine) {
    /// rangeの再描画は描画する線の本数が変化した時のみ行う
    if (graphControl.rangeMode) {
      makeRanges();
    }
    graphControl.aLine = getLength();
  }
  if (animationControlState.maxlen !== graphControl.tLine) {
    graphControl.tLine = animationControlState.maxlen;
    parameterSeekSetting(graphControl.tLine);
  } else if (graphControl.animatable) {
    parameterSeekSettingAnimate(graphControl.tLine, animationControlState.time);
  }
  graphControl.lastFrameZoom = graphControl.camera.zoom;
}

export function renderGraphThreeJs() {
  graphControl.renderer.render(graphControl.scene, graphControl.camera);
}

export function toScreenPosition(pos: THREE.Vector3) {
  const widthHalf = 0.5 * graphControl.renderer.getContext().canvas.width;
  const heightHalf = 0.5 * graphControl.renderer.getContext().canvas.height;

  pos.project(graphControl.camera);

  return {
    x: pos.x * widthHalf + widthHalf,
    y: -(pos.y * heightHalf) + heightHalf,
  };
}

export function updateRotate(autoRotate: boolean) {
  graphControl.controls.autoRotate = autoRotate;
}

export function update2DMode(twoDimensional: boolean) {
  graphControl.controls.enableRotate = !twoDimensional;
  graphControl.controls.mouseButtons = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LEFT: twoDimensional ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MIDDLE: THREE.MOUSE.DOLLY,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RIGHT: THREE.MOUSE.PAN,
  };
  if (twoDimensional) {
    graphControl.camera.position.copy(graphControl.controlsPosition0.clone());
    graphControl.controls.target.set(0, 0, 0);
    graphControl.camera.updateMatrix(); // make sure camera's local matrix is updated
    graphControl.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  }
}

export function startResizingGraphArea() {
  graphControl.resizeLoopCount = 0;
  setTimeout(() => {
    resizeGraphArea();
  }, 10);
}

export function resizeGraphArea() {
  graphControl.resizeLoopCount++;
  resizeGraphRenderer();
  //TODO: do this without timer
  if (graphControl.resizeLoopCount < 80)
    setTimeout(() => {
      resizeGraphArea();
    }, 10);
}

export function clearPlot() {
  graphControl.scene = new THREE.Scene();
  // TODO: 複数のプロットが存在するときの描画範囲について考える
  // TODO: 設定を変更した時に動的に変更が反映されるようにする
}

export function replotAll() {
  replotLines();
  animationControlState.time = 0;
}
