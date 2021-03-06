import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { replotLines } from './plotLineMap';
import { parameterSeekSetting, parameterSeekSettingAnimate } from './datGUI';
import { animate, animateTime, animationState, getLength, makeRanges } from './animation';
import { updateAxes } from './plot';
import { HydatState } from '../hydat/hydat';

/**
 * 描画，再描画，クリアなどを行う<br>
 * いわゆるView
 */

class GraphState {
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

export const graphState = new GraphState();

export function resizeGraphRenderer() {
  /**
   * ウィンドウサイズを変更した際, 座標空間も同様に拡大/縮小されるようにカメラ位置の調整等を行う
   */

  if (graphState.elem.clientWidth > 0 && graphState.elem.clientHeight > 0) {
    graphState.renderer.setSize(graphState.elem.clientWidth, graphState.elem.clientHeight);
    const prevWidth = graphState.camera.right - graphState.camera.left;
    const prevHeight = graphState.camera.top - graphState.camera.bottom;
    let extendRate;
    if (prevWidth != graphState.elem.clientWidth) extendRate = graphState.elem.clientWidth / prevWidth;
    else extendRate = graphState.elem.clientHeight / prevHeight;

    graphState.camera.left = -graphState.elem.clientWidth / 2;
    graphState.camera.right = graphState.elem.clientWidth / 2;
    graphState.camera.top = graphState.elem.clientHeight / 2;
    graphState.camera.bottom = -graphState.elem.clientHeight / 2;

    graphState.camera.zoom *= extendRate;

    graphState.camera.updateProjectionMatrix();

    const w = $('#scale_label_wrapper').width()!;
    const h = $('#scale_label_wrapper').height()!;
    $('#scaleLabelCanvas').attr('width', w);
    $('#scaleLabelCanvas').attr('height', h);
    updateAxes(true);

    $('#nameLabelCanvas').attr('width', w);
    $('#nameLabelCanvas').attr('height', h);
    modifyNameLabel(HydatState.currentHydat?.name);
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
  graphState.controls.update();
  if (graphState.lastFrameZoom !== graphState.camera.zoom) {
    replotAll();
  }
  updateAxes(false);
  if (graphState.animatable) {
    animate(); // animating function
    animateTime();
  } else {
    animate();
  }
  if (getLength() !== graphState.aLine) {
    /// rangeの再描画は描画する線の本数が変化した時のみ行う
    if (graphState.rangeMode) {
      makeRanges();
    }
    graphState.aLine = getLength();
  }
  if (animationState.maxlen !== graphState.tLine) {
    graphState.tLine = animationState.maxlen;
    parameterSeekSetting(graphState.tLine);
  } else if (graphState.animatable) {
    parameterSeekSettingAnimate(graphState.tLine, animationState.time);
  }
  graphState.lastFrameZoom = graphState.camera.zoom;
}

export function renderGraphThreeJs() {
  graphState.renderer.render(graphState.scene, graphState.camera);
}

export function toScreenPosition(pos: THREE.Vector3) {
  const widthHalf = 0.5 * graphState.renderer.getContext().canvas.width;
  const heightHalf = 0.5 * graphState.renderer.getContext().canvas.height;

  pos.project(graphState.camera);

  return {
    x: pos.x * widthHalf + widthHalf,
    y: -(pos.y * heightHalf) + heightHalf,
  };
}

export function updateRotate(autoRotate: boolean) {
  graphState.controls.autoRotate = autoRotate;
}

export function update2DMode(twoDimensional: boolean) {
  graphState.controls.enableRotate = !twoDimensional;
  graphState.controls.mouseButtons = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LEFT: twoDimensional ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MIDDLE: THREE.MOUSE.DOLLY,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RIGHT: THREE.MOUSE.PAN,
  };
  if (twoDimensional) {
    graphState.camera.position.copy(graphState.controlsPosition0.clone());
    graphState.controls.target.set(0, 0, 0);
    graphState.camera.updateMatrix(); // make sure camera's local matrix is updated
    graphState.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  }
}

export function startResizingGraphArea() {
  graphState.resizeLoopCount = 0;
  setTimeout(() => {
    resizeGraphArea();
  }, 10);
}

export function resizeGraphArea() {
  graphState.resizeLoopCount++;
  resizeGraphRenderer();
  //TODO: do this without timer
  if (graphState.resizeLoopCount < 80)
    setTimeout(() => {
      resizeGraphArea();
    }, 10);
}

export function clearPlot() {
  graphState.scene = new THREE.Scene();
  // TODO: 複数のプロットが存在するときの描画範囲について考える
  // TODO: 設定を変更した時に動的に変更が反映されるようにする
}

export function replotAll() {
  replotLines();
  animationState.time = 0;
}
