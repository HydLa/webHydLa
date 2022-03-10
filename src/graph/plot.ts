import * as THREE from 'three';
import { Object3D } from 'three';
import { graphState, renderGraphThreeJs, toScreenPosition } from './graph';
import { isAllReady } from './plotLineMap';
import { Triplet, RGB, ComparableTriplet, Range } from './plotUtils';
import { PlotSettingsControl } from './plotSettings';
import { showToast, stopPreloader } from '../UI/dom';
import { HydatPhase, HydatTimePP, HydatException } from '../hydat/hydat';
import { ParamCond, Construct, Constant } from '../hydat/parse';
import { range } from 'lodash';

const axisColorBases = new Triplet<RGB>(new RGB(1.0, 0.3, 0.3), new RGB(0.3, 1.0, 0.3), new RGB(0.3, 0.3, 1.0));

interface PlotState {
  array: number;
  plotStartTime?: number;

  axisColors: Triplet<string>;
  prevRanges?: ComparableTriplet<Range>;
  axisLines?: Triplet<THREE.Object3D>;
}

const plotState: PlotState = {
  array: -1,
  axisColors: new Triplet<string>('#FF8080', '#80FF80', '#8080FF'),
};

export function phaseToLineVectors(
  phase: HydatPhase,
  parameterCondition: ParamCond,
  axis: Triplet<Construct>,
  maxDeltaT: number
) {
  const line: { vec: THREE.Vector3; isPP: boolean }[] = [];
  let t;
  if (
    phase.simulationState != 'SIMULATED' &&
    phase.simulationState != 'TIME_LIMIT' &&
    phase.simulationState != 'STEP_LIMIT'
  ) {
    return line;
  }

  const env = new Map([...parameterCondition, ...phase.variableMap]);

  if (phase.time instanceof HydatTimePP) {
    env.set('t', phase.time.timePoint);
    line.push({
      vec: new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)),
      isPP: true,
    });
  } else {
    const startTime = phase.time.startTime.getValue(env);
    const endTime = phase.time.endTime.getValue(env);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      throw new HydatException(`invalid time interval: from ${phase.time.startTime} to ${phase.time.endTime}`);
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const MIN_STEP = 10; // Minimum step of plotting one IP
    const deltaT = Math.min(maxDeltaT, (endTime - startTime) / MIN_STEP);
    for (t = startTime; t < endTime; t = t + deltaT) {
      env.set('t', new Constant(t));
      line.push({
        vec: new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)),
        isPP: false,
      });
    }
    env.set('t', new Constant(endTime));
    line.push({
      vec: new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)),
      isPP: false,
    });
  }
  return line;
}

export function checkAndStopPreloader() {
  if (!isAllReady()) return;
  const currentTime = new Date().getTime();
  if (plotState.plotStartTime === undefined || currentTime - plotState.plotStartTime >= 1000) {
    showToast('Plot finished.', 1000, 'blue');
  }
  resetPlotStartTime();
  graphState.renderer.render(graphState.scene, graphState.camera);
  stopPreloader();
}

export function updateAxes(force: boolean) {
  const ranges = getRangesOfFrustum(graphState.camera);
  if (force === true || plotState.prevRanges === undefined || !ranges.equals(plotState.prevRanges)) {
    const maxIntervalPx = 200; // 50 px
    const minVisibleTicks = Math.floor(
      Math.max(graphState.elem.clientWidth, graphState.elem.clientHeight) / maxIntervalPx
    );
    const minVisibleRange = Math.min(ranges.x.getInterval(), ranges.y.getInterval(), ranges.z.getInterval());
    const maxInterval = minVisibleRange / minVisibleTicks;

    if (plotState.axisLines !== undefined) {
      graphState.scene.remove(plotState.axisLines.x);
      graphState.scene.remove(plotState.axisLines.y);
      graphState.scene.remove(plotState.axisLines.z);
    }
    let interval = Math.pow(10, Math.floor(Math.log(maxInterval) / Math.log(10)));
    interval = 1;
    plotState.axisLines = new Triplet<Object3D>(
      makeAxis(ranges.x, interval, new THREE.Color(plotState.axisColors.x)),
      makeAxis(ranges.y, interval, new THREE.Color(plotState.axisColors.y)),
      makeAxis(ranges.z, interval, new THREE.Color(plotState.axisColors.z))
    );

    plotState.axisLines.x.rotation.set(0, Math.PI / 2, Math.PI / 2);
    plotState.axisLines.y.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    graphState.scene.add(plotState.axisLines.x);
    graphState.scene.add(plotState.axisLines.y);
    graphState.scene.add(plotState.axisLines.z);
    renderGraphThreeJs();
  }
  updateAxisScaleLabel(ranges);
  plotState.prevRanges = ranges;
}

// eslint-disable-next-line max-lines-per-function
function getRangesOfFrustum(camera: THREE.OrthographicCamera): ComparableTriplet<Range> {
  const ranges = new ComparableTriplet<Range>(Range.getEmpty(), Range.getEmpty(), Range.getEmpty());

  // Near Plane dimensions
  const hNear = (camera.top - camera.bottom) / camera.zoom;
  const wNear = (camera.right - camera.left) / camera.zoom;

  // Far Plane dimensions
  const hFar = hNear;
  const wFar = wNear;

  const p = camera.position.clone();
  const l = graphState.controls.target.clone();
  const u = new THREE.Vector3(0, 1, 0);

  const d = new THREE.Vector3();
  d.subVectors(l, p);
  d.normalize();

  const crossD = u.clone();
  crossD.cross(d);
  const rotateAxis = crossD.clone();
  rotateAxis.normalize();
  const dot = u.dot(d);
  u.applyAxisAngle(rotateAxis, Math.acos(dot) - Math.PI / 2);

  const r = new THREE.Vector3();
  r.crossVectors(u, d);
  r.normalize();

  // Near Plane center
  const dTmp = d.clone();
  const nc = new THREE.Vector3();
  nc.addVectors(p, dTmp.multiplyScalar(camera.near));

  // Near Plane vertices
  const uTmp = u.clone();
  const rTmp = r.clone();
  const ntr = new THREE.Vector3();
  ntr.addVectors(nc, uTmp.multiplyScalar(hNear / 2));
  ntr.sub(rTmp.multiplyScalar(wNear / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  const ntl = new THREE.Vector3();
  ntl.addVectors(nc, uTmp.multiplyScalar(hNear / 2));
  ntl.add(rTmp.multiplyScalar(wNear / 2));

  const nbr = new THREE.Vector3();
  uTmp.copy(u);
  rTmp.copy(r);
  nbr.subVectors(nc, uTmp.multiplyScalar(hNear / 2));
  nbr.sub(rTmp.multiplyScalar(wNear / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  const nbl = new THREE.Vector3();
  nbl.subVectors(nc, uTmp.multiplyScalar(hNear / 2));
  nbl.add(rTmp.multiplyScalar(wNear / 2));

  // Far Plane center
  dTmp.copy(d);
  const fc = new THREE.Vector3();
  fc.addVectors(p, dTmp.multiplyScalar(camera.far));

  // Far Plane vertices
  uTmp.copy(u);
  rTmp.copy(r);
  const ftr = new THREE.Vector3();
  ftr.addVectors(fc, uTmp.multiplyScalar(hFar / 2));
  ftr.sub(rTmp.multiplyScalar(wFar / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  const ftl = new THREE.Vector3();
  ftl.addVectors(fc, uTmp.multiplyScalar(hFar / 2));
  ftl.add(rTmp.multiplyScalar(wFar / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  const fbr = new THREE.Vector3();
  fbr.subVectors(fc, uTmp.multiplyScalar(hFar / 2));
  fbr.sub(rTmp.multiplyScalar(wFar / 2));

  uTmp.copy(u);
  rTmp.copy(r);
  const fbl = new THREE.Vector3();
  fbl.subVectors(fc, uTmp.multiplyScalar(hFar / 2));
  fbl.add(rTmp.multiplyScalar(wFar / 2));

  graphState.camera.updateMatrix(); // make sure camera's local matrix is updated
  graphState.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  graphState.camera.matrixWorldInverse.getInverse(graphState.camera.matrixWorld);

  let frustum = new THREE.Frustum();
  frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(graphState.camera.projectionMatrix, graphState.camera.matrixWorldInverse)
  );
  frustum = expandFrustum(frustum);
  const intercepts = [
    // top surface
    calculateIntercept(ntr, ftr, ftl, ntl, frustum),
    // right surface
    calculateIntercept(ntr, nbr, fbr, ftr, frustum),
    // bottom surface
    calculateIntercept(nbr, nbl, fbl, fbr, frustum),
    // left surface
    calculateIntercept(ntl, nbl, fbl, ftl, frustum),
    // near surface
    calculateIntercept(ntl, ntr, nbr, nbl, frustum),
    // far surface
    calculateIntercept(ftl, ftr, fbr, fbl, frustum),
  ];

  const epsilon = 1e-8;
  const visibleX = Math.abs(d.y) + Math.abs(d.z) > epsilon,
    visibleY = Math.abs(d.z) + Math.abs(d.x) > epsilon,
    visibleZ = Math.abs(d.x) + Math.abs(d.y) > epsilon;
  for (const ic of intercepts) {
    if (visibleX && !isNaN(ic.x)) {
      ranges.x.min = Math.min(ranges.x.min, ic.x);
      ranges.x.max = Math.max(ranges.x.max, ic.x);
    }
    if (visibleY && !isNaN(ic.y)) {
      ranges.y.min = Math.min(ranges.y.min, ic.y);
      ranges.y.max = Math.max(ranges.y.max, ic.y);
    }
    if (visibleZ && !isNaN(ic.z)) {
      ranges.z.min = Math.min(ranges.z.min, ic.z);
      ranges.z.max = Math.max(ranges.z.max, ic.z);
    }
  }
  if (ranges.x.equals(Range.getEmpty())) {
    ranges.x.min = 0;
    ranges.x.max = 0;
  }
  if (ranges.y.equals(Range.getEmpty())) {
    ranges.y.min = 0;
    ranges.y.max = 0;
  }
  if (ranges.z.equals(Range.getEmpty())) {
    ranges.z.min = 0;
    ranges.z.max = 0;
  }
  return ranges;
}

/// calculate cross point of the plane and three axes(x, y, z).
/// The plane is defined by pointA, pointB, pointC and pointD.(The forth parameter is required to determine the range of the plane.)
function calculateIntercept(
  pointA: THREE.Vector3,
  pointB: THREE.Vector3,
  pointC: THREE.Vector3,
  pointD: THREE.Vector3,
  frustum: THREE.Frustum
) {
  const abVec = new THREE.Vector3().subVectors(pointB, pointA);
  const acVec = new THREE.Vector3().subVectors(pointC, pointA);
  const crossProduct = abVec.clone().cross(acVec);
  const ret = new THREE.Vector3();
  const sum = crossProduct.x * pointA.x + crossProduct.y * pointA.y + crossProduct.z * pointA.z;
  if (crossProduct.x == 0) ret.x = 0;
  else ret.x = sum / crossProduct.x;
  if (crossProduct.y == 0) ret.y = 0;
  else ret.y = sum / crossProduct.y;
  if (crossProduct.z == 0) ret.z = 0;
  else ret.z = sum / crossProduct.z;

  if (!frustum.containsPoint(new THREE.Vector3(ret.x, 0, 0))) ret.x = Number.NaN;
  if (!frustum.containsPoint(new THREE.Vector3(0, ret.y, 0))) ret.y = Number.NaN;
  if (!frustum.containsPoint(new THREE.Vector3(0, 0, ret.z))) ret.z = Number.NaN;
  return ret;
}

function expandFrustum(orig: THREE.Frustum) {
  const expanded = orig.clone();

  expandTwoPlanesOfFrustum(expanded.planes[0], expanded.planes[1]);
  expandTwoPlanesOfFrustum(expanded.planes[2], expanded.planes[3]);
  expandTwoPlanesOfFrustum(expanded.planes[4], expanded.planes[5]);
  return expanded;
}

function expandTwoPlanesOfFrustum(plane1: THREE.Plane, plane2: THREE.Plane) {
  const dot = plane1.normal.dot(plane2.normal);
  const rate = 1.1;

  if (dot * plane1.constant * plane2.constant > 0) {
    if (Math.abs(plane1.constant) > Math.abs(plane2.constant)) {
      plane1.constant *= rate;
      plane2.constant /= rate;
    } else {
      plane1.constant /= rate;
      plane2.constant *= rate;
    }
  } else {
    plane1.constant *= rate;
    plane2.constant *= rate;
  }
  return;
}

function makeAxis(range: Range, delta: number, color: THREE.Color) {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({ vertexColors: true });
  geometry.setFromPoints([new THREE.Vector3(0, 0, range.min), new THREE.Vector3(0, 0, range.max)]);
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array([...color.toArray(), ...color.toArray()]), 3)
  );
  const gridObj = new THREE.Object3D();
  gridObj.add(new THREE.LineSegments(geometry, material));
  return gridObj;
}

function updateAxisScaleLabel(ranges: ComparableTriplet<Range>) {
  const canvas = <HTMLCanvasElement>document.getElementById('scaleLabelCanvas');
  if (!canvas || !canvas.getContext) {
    return false;
  }

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!PlotSettingsControl.plotSettings.scaleLabelVisible) return;
  ctx.font = "20px 'Arial'";

  if (ranges.x.min !== 0 || ranges.x.max !== 0) {
    updateEachAxis(ctx, ranges.x, plotState.axisColors.x, (arg) => new THREE.Vector3(arg, 0, 0));
  }
  if (ranges.y.min !== 0 || ranges.y.max !== 0) {
    updateEachAxis(ctx, ranges.y, plotState.axisColors.y, (arg) => new THREE.Vector3(0, arg, 0));
  }
  if (ranges.z.min !== 0 || ranges.z.max !== 0) {
    updateEachAxis(ctx, ranges.z, plotState.axisColors.z, (arg) => new THREE.Vector3(0, 0, arg));
  }
}

function updateEachAxis(
  ctx: CanvasRenderingContext2D,
  range: Range,
  axisColor: string,
  embedFunc: (arg: number) => THREE.Vector3
) {
  const scaleInterval = calculateScaleInterval(range);
  const fixed = calculateNumberOfDigits(scaleInterval);
  ctx.fillStyle = axisColor;
  const start = Math.floor(range.min / scaleInterval) * scaleInterval;

  for (let i = 0; start + i * scaleInterval <= range.max; i++) {
    const current = start + i * scaleInterval;
    const vec = embedFunc(current);
    const pos = toScreenPosition(vec);
    ctx.fillText(current.toFixed(fixed), pos.x, pos.y);
  }
}

function calculateScaleInterval(range: Range) {
  const log = Math.log(range.getInterval()) / Math.log(10);
  const floor = Math.floor(log);
  const fractionalPart = log - floor;
  let scaleInterval = Math.pow(10, floor) / 5;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const log10_5 = 0.69;
  if (fractionalPart > log10_5) scaleInterval *= 5;
  if (scaleInterval <= 0) return Number.MAX_VALUE;
  return scaleInterval;
}

function calculateNumberOfDigits(interval: number) {
  let num = Math.floor(Math.log(interval) / Math.log(10));
  num = num > 0 ? 0 : -num;
  num = Math.max(num, 0);
  num = Math.min(num, 20);
  return num;
}

export function setBackgroundColor(color: string) {
  let colorVal = parseInt('0x' + color.substr(1));
  const b = colorVal % 256;
  colorVal /= 256;
  const g = colorVal % 256;
  colorVal /= 256;
  const r = colorVal;
  const brightness = Math.min(255, 256 - Math.max(r, g, b));

  plotState.axisColors = axisColorBases.map(
    (base) =>
      '#' +
      Math.floor(base.r * brightness)
        .toString(16)
        .padStart(2, '0') +
      Math.floor(base.g * brightness)
        .toString(16)
        .padStart(2, '0') +
      Math.floor(base.b * brightness)
        .toString(16)
        .padStart(2, '0')
  );
  graphState.renderer.setClearColor(color);
  updateAxes(true);
}

export function resetPlotStartTime() {
  plotState.plotStartTime = undefined;
}

export function setPlotStartTimeIfUnset(time: number) {
  if (plotState.plotStartTime === undefined) {
    plotState.plotStartTime = time;
  }
}
