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

    // 軸の数字を表示するために上からかぶせるキャンバスのサイズ調整
    const w = $('#scale_label_wrapper').width()!;
    const h = $('#scale_label_wrapper').height()!;
    $('#scaleLabelCanvas').attr('width', w);
    $('#scaleLabelCanvas').attr('height', h);
    updateAxes(true);
  }
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
  // animatable は、stop のチェックボックスのオンオフ
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
  // maxlen は webhydla の value バー の最大時間
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

// plot.ts にあるべき（そこからしか呼ばれていない）
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

// x-y mode が変更されたときに呼ばれる
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
  // x-y mode になったときに、カメラを初期位置に戻す
  if (twoDimensional) {
    graphState.camera.position.copy(graphState.controlsPosition0.clone());
    graphState.controls.target.set(0, 0, 0);
    graphState.camera.updateMatrix(); // make sure camera's local matrix is updated
    graphState.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  }
}

// TODO: 使用されていない関数
export function startResizingGraphArea() {
  graphState.resizeLoopCount = 0;
  setTimeout(() => {
    resizeGraphArea();
  }, 10);
}

// TODO: 使用されていない関数
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
  // TODO: directionalLight が生成されていない。
}

export function replotAll() {
  replotLines();
  animationState.time = 0;
}
