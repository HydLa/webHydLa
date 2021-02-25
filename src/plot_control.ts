import { graphControl, renderGraph_three_js, toScreenPosition } from './graph_control';
import { PlotLineMapControl } from './plot_line_map_control';
import { showToast, stopPreloader } from './dom_control';

import * as THREE from 'three';
import { Triplet, RGB, ComparableTriplet, Range } from './plot_utils';
import { Object3D } from 'three';
import { HydatPhase, HydatTimePP, HydatException } from './hydat';
import { PlotSettingsControl } from './plot_settings';
import { Env, ParamCond, Construct, Constant } from './parse';

const axisColorBases = new Triplet<RGB>(new RGB(1.0, 0.3, 0.3), new RGB(0.3, 1.0, 0.3), new RGB(0.3, 0.3, 1.0));

interface PlotState {
  array: number;
  plotStartTime?: number;

  axisColors: Triplet<string>;
  prev_ranges?: ComparableTriplet<Range>;
  axisLines?: Triplet<THREE.Object3D>;
}

const plotState: PlotState = {
  array: -1,
  axisColors: new Triplet<string>('#FF8080', '#80FF80', '#8080FF'),
};

export function phase_to_line_vectors(
  phase: HydatPhase,
  parameter_condition: ParamCond,
  axis: Triplet<Construct>,
  maxDeltaT: number
) {
  const line: { vec: THREE.Vector3; isPP: boolean }[] = [];
  let t;
  if (
    phase.simulation_state != 'SIMULATED' &&
    phase.simulation_state != 'TIME_LIMIT' &&
    phase.simulation_state != 'STEP_LIMIT'
  ) {
    return line;
  }

  const env = new Map([...parameter_condition, ...phase.variable_map]);

  if (phase.time instanceof HydatTimePP) {
    env.set('t', phase.time.time_point);
    line.push({
      vec: new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)),
      isPP: true,
    });
  } else {
    const start_time = phase.time.start_time.getValue(env);
    const end_time = phase.time.end_time.getValue(env);
    if (!Number.isFinite(start_time) || !Number.isFinite(end_time)) {
      throw new HydatException(`invalid time interval: from ${phase.time.start_time} to ${phase.time.end_time}`);
    }
    const MIN_STEP = 10; // Minimum step of plotting one IP
    const delta_t = Math.min(maxDeltaT, (end_time - start_time) / MIN_STEP);
    for (t = start_time; t < end_time; t = t + delta_t) {
      env.set('t', new Constant(t));
      line.push({
        vec: new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)),
        isPP: false,
      });
    }
    env.set('t', new Constant(end_time));
    line.push({
      vec: new THREE.Vector3(axis.x.getValue(env), axis.y.getValue(env), axis.z.getValue(env)),
      isPP: false,
    });
  }
  return line;
}

export function checkAndStopPreloader() {
  if (!PlotLineMapControl.isAllReady()) return;
  const current_time = new Date().getTime();
  if (plotState.plotStartTime === undefined || current_time - plotState.plotStartTime >= 1000) {
    showToast('Plot finished.', 1000, 'blue');
  }
  resetPlotStartTime();
  graphControl.renderer.render(graphControl.scene, graphControl.camera);
  stopPreloader();
}

export function update_axes(force: boolean) {
  const ranges = getRangesOfFrustum(graphControl.camera);
  if (force === true || plotState.prev_ranges === undefined || !ranges.equals(plotState.prev_ranges)) {
    const max_interval_px = 200; // 50 px
    const min_visible_ticks = Math.floor(
      Math.max(graphControl.elem.clientWidth, graphControl.elem.clientHeight) / max_interval_px
    );
    const min_visible_range = Math.min(ranges.x.getInterval(), ranges.y.getInterval(), ranges.z.getInterval());
    const max_interval = min_visible_range / min_visible_ticks;

    if (plotState.axisLines !== undefined) {
      graphControl.scene.remove(plotState.axisLines.x);
      graphControl.scene.remove(plotState.axisLines.y);
      graphControl.scene.remove(plotState.axisLines.z);
    }
    let interval = Math.pow(10, Math.floor(Math.log(max_interval) / Math.log(10)));
    interval = 1;
    plotState.axisLines = new Triplet<Object3D>(
      makeAxis(ranges.x, interval, new THREE.Color(plotState.axisColors.x)),
      makeAxis(ranges.y, interval, new THREE.Color(plotState.axisColors.y)),
      makeAxis(ranges.z, interval, new THREE.Color(plotState.axisColors.z))
    );

    plotState.axisLines.x.rotation.set(0, Math.PI / 2, Math.PI / 2);
    plotState.axisLines.y.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    graphControl.scene.add(plotState.axisLines.x);
    graphControl.scene.add(plotState.axisLines.y);
    graphControl.scene.add(plotState.axisLines.z);
    renderGraph_three_js();
  }
  updateAxisScaleLabel(ranges);
  plotState.prev_ranges = ranges;
}

function getRangesOfFrustum(camera: THREE.OrthographicCamera): ComparableTriplet<Range> {
  const ranges = new ComparableTriplet<Range>(Range.getEmpty(), Range.getEmpty(), Range.getEmpty());

  // Near Plane dimensions
  const hNear = (camera.top - camera.bottom) / camera.zoom;
  const wNear = (camera.right - camera.left) / camera.zoom;

  // Far Plane dimensions
  const hFar = hNear;
  const wFar = wNear;

  const p = camera.position.clone();
  const l = graphControl.controls.target.clone();
  const u = new THREE.Vector3(0, 1, 0);

  const d = new THREE.Vector3();
  d.subVectors(l, p);
  d.normalize();

  const cross_d = u.clone();
  cross_d.cross(d);
  const rotate_axis = cross_d.clone();
  rotate_axis.normalize();
  const dot = u.dot(d);
  u.applyAxisAngle(rotate_axis, Math.acos(dot) - Math.PI / 2);

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

  graphControl.camera.updateMatrix(); // make sure camera's local matrix is updated
  graphControl.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
  graphControl.camera.matrixWorldInverse.getInverse(graphControl.camera.matrixWorld);

  let frustum = new THREE.Frustum();
  frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(graphControl.camera.projectionMatrix, graphControl.camera.matrixWorldInverse)
  );
  frustum = expandFrustum(frustum);
  const intercepts = [
    // top surface
    calculate_intercept(ntr, ftr, ftl, ntl, frustum),
    // right surface
    calculate_intercept(ntr, nbr, fbr, ftr, frustum),
    // bottom surface
    calculate_intercept(nbr, nbl, fbl, fbr, frustum),
    // left surface
    calculate_intercept(ntl, nbl, fbl, ftl, frustum),
    // near surface
    calculate_intercept(ntl, ntr, nbr, nbl, frustum),
    // far surface
    calculate_intercept(ftl, ftr, fbr, fbl, frustum),
  ];

  const epsilon = 1e-8;
  const visible_x = Math.abs(d.y) + Math.abs(d.z) > epsilon,
    visible_y = Math.abs(d.z) + Math.abs(d.x) > epsilon,
    visible_z = Math.abs(d.x) + Math.abs(d.y) > epsilon;
  for (const ic of intercepts) {
    if (visible_x && !isNaN(ic.x)) {
      ranges.x.min = Math.min(ranges.x.min, ic.x);
      ranges.x.max = Math.max(ranges.x.max, ic.x);
    }
    if (visible_y && !isNaN(ic.y)) {
      ranges.y.min = Math.min(ranges.y.min, ic.y);
      ranges.y.max = Math.max(ranges.y.max, ic.y);
    }
    if (visible_z && !isNaN(ic.z)) {
      ranges.z.min = Math.min(ranges.z.min, ic.z);
      ranges.z.max = Math.max(ranges.z.max, ic.z);
    }
  }
  return ranges;
}

/// calculate cross point of the plane and three axes(x, y, z).
/// The plane is defined by point_a, point_b, point_c and point_d.(The forth parameter is required to determine the range of the plane.)
function calculate_intercept(
  point_a: THREE.Vector3,
  point_b: THREE.Vector3,
  point_c: THREE.Vector3,
  point_d: THREE.Vector3,
  frustum: THREE.Frustum
) {
  const ab_vec = new THREE.Vector3().subVectors(point_b, point_a);
  const ac_vec = new THREE.Vector3().subVectors(point_c, point_a);
  const cross_product = ab_vec.clone().cross(ac_vec);
  const ret = new THREE.Vector3();
  const sum = cross_product.x * point_a.x + cross_product.y * point_a.y + cross_product.z * point_a.z;
  if (cross_product.x == 0) ret.x = 0;
  else ret.x = sum / cross_product.x;
  if (cross_product.y == 0) ret.y = 0;
  else ret.y = sum / cross_product.y;
  if (cross_product.z == 0) ret.z = 0;
  else ret.z = sum / cross_product.z;

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
  const geometry = new THREE.Geometry();
  const material = new THREE.LineBasicMaterial({ vertexColors: true });
  geometry.vertices.push(new THREE.Vector3(0, 0, range.min), new THREE.Vector3(0, 0, range.max));
  geometry.colors.push(color, color);
  const grid_obj = new THREE.Object3D();
  grid_obj.add(new THREE.LineSegments(geometry, material));
  return grid_obj;
}

function updateAxisScaleLabel(ranges: ComparableTriplet<Range>) {
  const canvas = <HTMLCanvasElement>document.getElementById('scaleLabelCanvas');
  if (!canvas || !canvas.getContext) {
    return false;
  }

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!PlotSettingsControl.plot_settings.scaleLabelVisible) return;
  ctx.font = "20px 'Arial'";

  updateEachAxis(ctx, ranges.x, plotState.axisColors.x, (arg) => new THREE.Vector3(arg, 0, 0));
  updateEachAxis(ctx, ranges.y, plotState.axisColors.y, (arg) => new THREE.Vector3(0, arg, 0));
  updateEachAxis(ctx, ranges.z, plotState.axisColors.z, (arg) => new THREE.Vector3(0, 0, arg));
}

function updateEachAxis(
  ctx: CanvasRenderingContext2D,
  range: Range,
  axisColor: string,
  embedFunc: (arg: number) => THREE.Vector3
) {
  const scale_interval = calculateScaleInterval(range);
  const fixed = calculateNumberOfDigits(scale_interval);
  ctx.fillStyle = axisColor;
  const start = Math.floor(range.min / scale_interval) * scale_interval;

  for (let i = 0; start + i * scale_interval <= range.max; i++) {
    const current = start + i * scale_interval;
    const vec = embedFunc(current);
    const pos = toScreenPosition(vec);
    ctx.fillText(current.toFixed(fixed), pos.x, pos.y);
  }
}

function calculateScaleInterval(range: Range) {
  const log = Math.log(range.getInterval()) / Math.log(10);
  const floor = Math.floor(log);
  const fractional_part = log - floor;
  let scale_interval = Math.pow(10, floor) / 5;
  const log10_5 = 0.69;
  if (fractional_part > log10_5) scale_interval *= 5;
  if (scale_interval <= 0) return Number.MAX_VALUE;
  return scale_interval;
}

function calculateNumberOfDigits(interval: number) {
  let num = Math.floor(Math.log(interval) / Math.log(10));
  num = num > 0 ? 0 : -num;
  num = Math.max(num, 0);
  num = Math.min(num, 20);
  return num;
}

export function setBackgroundColor(color: string) {
  let color_val = parseInt('0x' + color.substr(1));
  const b = color_val % 256;
  color_val /= 256;
  const g = color_val % 256;
  color_val /= 256;
  const r = color_val;
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
  graphControl.renderer.setClearColor(color);
  update_axes(true);
}

export function resetPlotStartTime() {
  plotState.plotStartTime = undefined;
}

export function setPlotStartTimeIfUnset(time: number) {
  if (plotState.plotStartTime === undefined) {
    plotState.plotStartTime = time;
  }
}
