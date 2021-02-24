import { PlotLine } from './plot_line';
import { PlotControl } from './plot_control';
import { startPreloader, showToast } from './dom_control';
import * as THREE from 'three';
import { GraphControl } from './graph_control';
import { HydatParameter, HydatParameterInterval, HydatPhase } from './hydat';
import { RGB, Triplet } from './plot_utils';
import { HydatControl } from './hydat_control';
import { parse, Construct, Constant } from './parse';
import { MultiBiMap } from './animation_utils';

/**
 * 描画用オブジェクトの計算，描画，削除を担当
 */
interface AnimationControlState {
  current_line_vec_animation: THREE.Vector3[];
  maxlen: number;
  /** ボールの軌道のリスト */
  animation_line: { vecs: THREE.Vector3[]; color: number }[];

  /** 描画におけるグローバル時間 */
  time: number;
  time_prev: number;

  /** 描画したボールを登録しておく */
  plot_animate: THREE.Mesh[];

  // 動的描画
  /** 何本の線を動的に追加したか */
  line_count: number;
  /** 動的に描画したい線 */
  dynamic_lines: any[][];
  /** sceneに追加された線を登録しておく */
  drawn_dynamic_lines: any[][];

  /**
   * 最適化のために各PPまでの線を累積マージして格納しておく<br>
   * accumulative_merged_lines[i][j]: i本目の線について2j+1フェーズ目までの線をマージした線
   */
  accumulative_merged_lines: any[][];
  /** accumulative_merged_linesをどこまで追加したか */
  amli: number;

  /** PlotLine.indexとPlotControl.arrayの対応 */
  index_array_multibimap: MultiBiMap<number, number>;
}

export const animationControlState: AnimationControlState = {
  current_line_vec_animation: [],
  maxlen: 0,
  animation_line: [],
  time: 0,
  time_prev: -100,
  plot_animate: [],
  line_count: 0,
  dynamic_lines: [],
  drawn_dynamic_lines: [],
  accumulative_merged_lines: [],
  amli: 0,
  index_array_multibimap: new MultiBiMap<number, number>(),
};

/**
 * colorAngleを起点にして、色相をcolorNum個に等分し、
 * 各点の色を16進6桁の配列で返す
 */
function getColors(colorNum: number, colorAngle: number) {
  const angle = 360 / colorNum;
  const angle_start = Math.floor(colorAngle);
  const retColors: number[] = [];
  for (let i = 0; i < colorNum; i++) {
    retColors.push(RGB.fromHue((Math.floor(angle * i) + angle_start) % 360).asHex24());
  }
  return retColors;
}

function add_plot(line: PlotLine) {
  let axes: Triplet<Construct>;
  if (line.settings.x == '' || line.settings.y == '' || line.settings.z == '') {
    return;
  }
  try {
    axes = new Triplet<Construct>(parse(line.settings.x), parse(line.settings.y), parse(line.settings.z));
    line.updateFolder(true);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
    line.updateFolder(false);
    return;
  }
  if (HydatControl.current_hydat === undefined) {
    throw new Error('current_hydat is undefined');
  }
  const dt = PlotControl.plot_settings.plotInterval;
  const phase = HydatControl.current_hydat.first_phases[0];
  const parameter_condition_list = PlotControl.divideParameter(HydatControl.current_hydat.parameters);
  const color = getColors(parameter_condition_list.length, line.color_angle);
  line.plot_information = {
    phase_index_array: [{ phase: phase, index: 0 }],
    axes: axes,
    line: line,
    width: PlotControl.plot_settings.lineWidth,
    color: color,
    dt: dt,
    parameter_condition_list: parameter_condition_list,
  };
  startPreloader();
  PlotControl.array = -1;
  animationControlState.animation_line = [];
  animationControlState.maxlen = 0;
  if (line.plot_ready == undefined)
    requestAnimationFrame(() => {
      line.plotReady();
    });
}

/**
 * startPosからendPosまで幅scaledWidthの線をcylinderMeshで作る<br>
 * Lineを使わないのはLineの太さが変わらないバグがあるため<br>
 * https://threejs.org/docs/#api/en/materials/LineBasicMaterial.linewidth
 */
function make_cylinder(startPos: THREE.Vector3, endPos: THREE.Vector3, scaledWidth: number, material: THREE.Material) {
  const directionVec = endPos.clone().sub(startPos);
  const height = directionVec.length();
  directionVec.normalize();
  const cylinderMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(scaledWidth, scaledWidth, height + scaledWidth, 8, 1),
    material
  );

  const upVec = new THREE.Vector3(0, 1, 0);
  const rotationAxis = upVec.clone().cross(directionVec).normalize();
  const rotationAngle = Math.acos(upVec.dot(directionVec));

  const newpos = startPos.clone().lerp(endPos, 0.5);
  cylinderMesh.position.set(newpos.x, newpos.y, newpos.z);
  cylinderMesh.setRotationFromAxisAngle(rotationAxis, rotationAngle);

  cylinderMesh.updateMatrix();
  return cylinderMesh;
}

function add_line(
  current_line_vec: { vec: THREE.Vector3; isPP: boolean }[],
  color: number,
  line: PlotLine,
  width: number
) {
  const useLine = width === 1;
  PlotControl.array += 1;

  animationControlState.index_array_multibimap.set(line.index, PlotControl.array);

  const lines: THREE.Vector3[] = [];
  const linesGeometry = new THREE.Geometry();
  const scaledWidth = (0.5 * width) / GraphControl.camera.zoom;
  const dottedLength = 10.0 / GraphControl.camera.zoom;
  const material = useLine
    ? new THREE.LineBasicMaterial({ color: color })
    : new THREE.MeshBasicMaterial({ color: color });

  const tmp_dynamic_line: any[] = [];
  if (PlotControl.plot_settings.dynamicDraw) {
    if (animationControlState.accumulative_merged_lines.length - 1 < PlotControl.array)
      animationControlState.accumulative_merged_lines.push([]);
    if (animationControlState.dynamic_lines.length - 1 < PlotControl.array)
      animationControlState.dynamic_lines.push([]);
  }
  for (let i = 0; i + 1 < current_line_vec.length; i++) {
    if (current_line_vec[i + 1].isPP) {
      const posBegin = current_line_vec[i].vec;
      const posEnd = current_line_vec[i + 1].vec;
      const directionVec = posEnd.clone().sub(posBegin);
      const lineLength = directionVec.length();
      directionVec.normalize();
      const numOfDots = lineLength / dottedLength;
      const tmp_geometry = new THREE.Geometry();
      for (let j = 1; j + 1 < numOfDots; j += 2) {
        // 点線の各点を追加
        const tmpBegin = posBegin.clone().add(directionVec.clone().multiplyScalar(j * dottedLength));
        const tmpEnd = posBegin.clone().add(directionVec.clone().multiplyScalar((j + 1) * dottedLength));
        if (useLine) {
          lines.push(tmpBegin, tmpEnd);
        } else {
          const l = make_cylinder(tmpBegin, tmpEnd, scaledWidth, material);
          if (PlotControl.plot_settings.dynamicDraw) tmp_geometry.merge(<any>l.geometry.clone(), l.matrix.clone());
          linesGeometry.merge(<any>l.geometry, l.matrix);
        }
      }
      if (PlotControl.plot_settings.dynamicDraw) {
        const l: any = useLine ? make_line([posBegin, posEnd], material) : new THREE.Mesh(tmp_geometry, material);
        l.isPP = true;
        tmp_dynamic_line.push(l);

        animationControlState.accumulative_merged_lines[PlotControl.array].push(
          useLine ? make_line(lines.concat(), material, true) : new THREE.Mesh(linesGeometry.clone(), material)
        );
      }
    } else if (!current_line_vec[i].vec.equals(current_line_vec[i + 1].vec)) {
      // IPの各折れ線を追加
      if (useLine) {
        if (PlotControl.plot_settings.dynamicDraw) {
          const l = make_line([current_line_vec[i].vec, current_line_vec[i + 1].vec], material);
          tmp_dynamic_line.push(l);
        }
        lines.push(current_line_vec[i].vec, current_line_vec[i + 1].vec);
      } else {
        const l = make_cylinder(current_line_vec[i].vec, current_line_vec[i + 1].vec, scaledWidth, material);
        if (PlotControl.plot_settings.dynamicDraw) tmp_dynamic_line.push(l);
        linesGeometry.merge(<any>l.geometry, l.matrix);
      }
    }
  }
  if (PlotControl.plot_settings.dynamicDraw) animationControlState.dynamic_lines[PlotControl.array] = tmp_dynamic_line;

  const three_line = useLine ? make_line(lines, material, true) : new THREE.Mesh(linesGeometry, material);
  if (!PlotControl.plot_settings.dynamicDraw) GraphControl.scene.add(three_line);

  if (!line.plot) {
    throw new Error('unexpected: line.plot is undefined');
  }
  line.plot.push(three_line);

  animationControlState.animation_line[PlotControl.array] = {
    vecs: animationControlState.current_line_vec_animation,
    color: color,
  };
  if (animationControlState.maxlen < animationControlState.current_line_vec_animation.length) {
    animationControlState.maxlen = animationControlState.current_line_vec_animation.length;
  }
}

/**
 * 太さが変わらないバグはあるものの，軽量なので太さが1で良い時はLineを使う
 */
function make_line(points: THREE.Vector3[], material: THREE.Material, segments = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  if (segments) return new THREE.LineSegments(geometry, material);
  else return new THREE.Line(geometry, material);
}

function add_sphere(current_param_idx: number, color: number[]) {
  const s_geometry = new THREE.SphereBufferGeometry(0.1);
  const sphere = new THREE.Mesh(s_geometry, new THREE.MeshBasicMaterial({ color: color[current_param_idx] }));
  sphere.position.set(0, 0, 0);
  GraphControl.scene.add(sphere);
  animationControlState.plot_animate[PlotControl.array] = sphere;
}

/** dfs to add plot each line */
export function dfs_each_line(
  phase_index_array: { phase: HydatPhase; index: number }[],
  axes: Triplet<Construct>,
  line: PlotLine,
  width: number,
  color: number[],
  dt: number,
  parameter_condition_list: { [key: string]: Constant }[],
  current_param_idx: number,
  current_line_vec: { vec: THREE.Vector3; isPP: boolean }[]
) {
  try {
    for (;;) {
      if (line.plot_ready) {
        line.plotting = false;
        console.log('Plot is interrupted');
        PlotControl.PlotStartTime = undefined;
        return;
      }

      // phase_index_array is used to implement dfs without function call.
      let phase_index = phase_index_array[phase_index_array.length - 1]; // top
      let phase = phase_index.phase;
      const vec = PlotControl.phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, dt);
      current_line_vec = current_line_vec.concat(vec);
      const vec_animation = PlotControl.phase_to_line_vectors(
        phase,
        parameter_condition_list[current_param_idx],
        axes,
        0.01
      ); // tを0.01刻みで点を取る -> time = t * 100
      // animationControlState.current_line_vec_animation = animationControlState.current_line_vec_animation.concat(vec_animation);
      for (const v of vec_animation) {
        animationControlState.current_line_vec_animation.push(v.vec);
      }
      if (phase.children.length == 0) {
        // on leaves
        add_line(current_line_vec, color[current_param_idx], line, width);
        add_sphere(current_param_idx, color);

        current_line_vec = [];
        animationControlState.current_line_vec_animation = [];
        phase_index_array.pop();
        phase_index = phase_index_array[phase_index_array.length - 1];
        ++phase_index.index;
        phase = phase_index.phase;
      }
      while2: for (;;) {
        // search next child to plot
        for (; /* restart searching */ phase_index.index < phase.children.length; phase_index.index++) {
          const child = phase.children[phase_index.index];
          const included_by_parameter_condition = check_parameter_condition(
            child.parameter_maps,
            parameter_condition_list[current_param_idx]
          );
          if (included_by_parameter_condition) {
            // パラメータに含まれるchild，つまり描画するべきchildが見つかった
            phase_index_array.push({ phase: child, index: 0 }); // start from 0th child
            const current_time = new Date().getTime();
            if (current_time - line.last_plot_time >= 200) {
              // interrupt searching
              line.last_plot_time = current_time;
              // use setTimeout to check event queue
              requestAnimationFrame(function () {
                dfs_each_line(
                  phase_index_array,
                  axes,
                  line,
                  width,
                  color,
                  dt,
                  parameter_condition_list,
                  current_param_idx,
                  current_line_vec
                );
              });
              return;
            }
            break while2; // go to child
          }
        }

        // 以下，描画するべきchildが見つからなかった場合
        // Plot for this current_param_idx is completed.
        if (phase_index_array.length == 1) {
          if (current_param_idx == parameter_condition_list.length - 1) {
            // last
            // Plot is completed.
            line.plotting = false;
            PlotControl.checkAndStopPreloader();
            return;
          } else {
            // 次のparameter conditionで探索しなおす
            ++current_param_idx;
            phase_index_array[0].index = 0;
            break;
          }
        } else {
          // go to parent phase
          phase_index_array.pop();
          phase_index = phase_index_array[phase_index_array.length - 1];
          ++phase_index.index;
          phase = phase_index.phase; // start from next sibling
        }
      }
    }
  } catch (ex) {
    console.log(ex);
    console.log(ex.stack);
    showToast(`Plot failed: ${ex.name}(${ex.message})`, 3000, 'red darken-4');
    line.plotting = false;
    PlotControl.checkAndStopPreloader();
  }
}

export function remove_plot(line: PlotLine) {
  if (line.plot !== undefined) {
    let i: number;
    for (i = 0; i < line.plot.length; i++) {
      GraphControl.scene.remove(line.plot[i]);
    }
    delete line.plot[i];
  }
  animationControlState.index_array_multibimap.deleteKey(line.index);
  line.plot = [];
}

function remove_mesh(line: THREE.Mesh[] | undefined) {
  if (line !== undefined) {
    for (let i = 0; i < line.length; i++) {
      GraphControl.scene.remove(line[i]);
      delete line[i];
    }
    line.length = 0;
  }
}

export function resetAnimation(line: PlotLine) {
  remove_plot(line);
  remove_mesh(animationControlState.plot_animate);
  add_plot(line);
}

/** parameter_condition_listの値がparameter_mapsの範囲内にあるか */
function check_parameter_condition(
  parameter_maps: { [key: string]: HydatParameter }[],
  parameter_condition_list: { [key: string]: Constant }
) {
  const epsilon = 0.0001;
  for (const map of parameter_maps) {
    let included = true;
    for (const key in map) {
      const p = map[key];
      const c = parameter_condition_list[key];
      if (c === undefined) continue;
      if (p instanceof HydatParameterInterval) {
        const lb = p.lower_bound.value.getValue(parameter_condition_list);
        const ub = p.upper_bound.value.getValue(parameter_condition_list);
        if (
          !(
            lb <= c.getValue(parameter_condition_list) + epsilon && ub >= c.getValue(parameter_condition_list) - epsilon
          )
        ) {
          included = false;
        }
      } else if (
        !(
          p.unique_value.getValue(parameter_condition_list) <= c.getValue(parameter_condition_list) + epsilon &&
          p.unique_value.getValue(parameter_condition_list) >= c.getValue(parameter_condition_list) - epsilon
        )
      ) {
        included = false;
      }
    }
    if (included) {
      return true;
    }
  }
  return false;
}

/**
 * parameterがfixed: false, range: trueの時に描画する面を作成
 */
export function makeRanges() {
  if (GraphControl.face_a != undefined) {
    remove_mesh(GraphControl.face_a);
  }
  GraphControl.face_a = [];
  if (animationControlState.animation_line.length != 0) {
    for (let j = 0; j < animationControlState.animation_line.length - 1; j++) {
      const face_geometry = new THREE.Geometry();
      let time_r = 0;
      for (let i = 0; i < animationControlState.maxlen; i++) {
        if (animationControlState.animation_line[j].vecs[time_r] == undefined) {
          break;
        } else if (animationControlState.animation_line[j + 1].vecs[time_r] == undefined) {
          break;
        } else {
          face_geometry.vertices.push(
            animationControlState.animation_line[j].vecs[time_r].clone(),
            animationControlState.animation_line[j + 1].vecs[time_r].clone()
          );
        }
        time_r++;
      }
      for (let k = 0; k < face_geometry.vertices.length - 2; k++) {
        face_geometry.faces.push(new THREE.Face3(k, k + 1, k + 2));
      }
      face_geometry.computeFaceNormals();
      face_geometry.computeVertexNormals();
      const faceMesh = new THREE.Mesh(
        face_geometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          depthTest: true,
          transparent: true,
          side: THREE.DoubleSide,
          opacity: 0.5,
        })
      );
      GraphControl.scene.add(faceMesh);
      GraphControl.face_a.push(faceMesh);
    }
    GraphControl.render_three_js();
  }
}

/** i番目のdrawn dynamic lineを消す */
function remove_ith_drawn_dynamic_line(i: number) {
  for (const l of animationControlState.drawn_dynamic_lines[i]) {
    GraphControl.scene.remove(l);
  }
  animationControlState.drawn_dynamic_lines[i] = [];
}

/** 全てのdrawn dynamic lineを消す */
function remove_drawn_dynamic_lines() {
  for (let i = 0; i < animationControlState.drawn_dynamic_lines.length; i++) {
    remove_ith_drawn_dynamic_line(i);
  }
  animationControlState.drawn_dynamic_lines = [];
}

function remove_ith_dynamic_line(i: number) {
  remove_ith_drawn_dynamic_line(i);
  animationControlState.dynamic_lines[i] = [];
  animationControlState.accumulative_merged_lines[i] = [];
  animationControlState.index_array_multibimap.deleteValue(i);
}

export function remove_dynamic_line(line: PlotLine) {
  if (animationControlState.index_array_multibimap.hasKey(line.index)) {
    const values = animationControlState.index_array_multibimap.getValue(line.index);
    values.forEach((i) => remove_ith_dynamic_line(i));
  }
}

export function remove_dynamic_lines() {
  for (let i = 0; i < animationControlState.drawn_dynamic_lines.length; i++) {
    remove_ith_dynamic_line(i);
  }
  animationControlState.dynamic_lines = [];
  animationControlState.accumulative_merged_lines = [];
}

/** 現在時刻以下の線をsceneに追加する */
function draw_dynamic_lines() {
  let tmp_line_count = animationControlState.line_count;
  let tmp_amli = animationControlState.amli;
  for (let i = 0; i < animationControlState.dynamic_lines.length; i++) {
    if (animationControlState.dynamic_lines[i].length == 0) continue;
    if (animationControlState.drawn_dynamic_lines.length - 1 < i) animationControlState.drawn_dynamic_lines.push([]);
    tmp_line_count = animationControlState.line_count;
    tmp_amli = animationControlState.amli;
    for (let j = tmp_line_count; j < animationControlState.dynamic_lines[i].length; j++) {
      // 差分のみ追加
      if ('isPP' in animationControlState.dynamic_lines[i][j]) {
        // PP
        // これまで追加した線を取り除き，代わりにマージ済みの線を追加する
        remove_ith_drawn_dynamic_line(i);
        GraphControl.scene.add(animationControlState.accumulative_merged_lines[i][tmp_amli]);
        animationControlState.drawn_dynamic_lines[i].push(animationControlState.accumulative_merged_lines[i][tmp_amli]);
        tmp_amli++;
      } else if (j + 1 < animationControlState.time) {
        // IP
        GraphControl.scene.add(animationControlState.dynamic_lines[i][j]);
        animationControlState.drawn_dynamic_lines[i].push(animationControlState.dynamic_lines[i][j]);
      } else {
        // timeより未来の線は書かない
        break;
      }
      tmp_line_count++;
    }
  }
  animationControlState.line_count = tmp_line_count;
  animationControlState.amli = tmp_amli;
}

/**
 * ボールの位置を動的に変更して動いているように見せる
 * dynamic drawモードなら線も動的に追加する
 */
export function animate() {
  if (animationControlState.time_prev !== animationControlState.time) {
    animationControlState.plot_animate = [];
    let arr = 0;
    if (animationControlState.time > animationControlState.maxlen - 1) {
      animationControlState.time = 0;
    }
    for (const sphere of GraphControl.scene.children) {
      if (animationControlState.animation_line[arr] === undefined) {
        continue;
      }

      if (!(sphere instanceof THREE.Mesh)) continue;
      if (!(sphere.material instanceof THREE.MeshBasicMaterial)) {
        console.error('unexpected: !(sphere.material instanceof THREE.MeshBasicMaterial)');
        continue;
      }
      if (!(sphere.geometry instanceof THREE.SphereBufferGeometry)) continue;
      if (animationControlState.time === 0) {
        sphere.material.color.set(animationControlState.animation_line[arr].color);
      }
      if (animationControlState.time > animationControlState.animation_line[arr].vecs.length - 1) {
        arr++;
        continue;
      }
      if (animationControlState.index_array_multibimap.hasValue(arr)) {
        sphere.position.copy(animationControlState.animation_line[arr].vecs[animationControlState.time]);
      } else {
        sphere.position.set(0, 0, 0);
      }
      animationControlState.plot_animate[arr] = sphere;
      arr += 1;
    }

    if (PlotControl.plot_settings.dynamicDraw) {
      if (animationControlState.time == 0) {
        remove_drawn_dynamic_lines();
        animationControlState.line_count = 0;
        animationControlState.amli = 0;
      }
      draw_dynamic_lines();
    }

    animationControlState.time_prev = animationControlState.time;
    GraphControl.render_three_js();
  }
}

export function animateTime() {
  animationControlState.time++;
}

export function getLength() {
  return animationControlState.animation_line.length;
}

/** 指定時刻にシーク（移動）する */
export function seekAnimation(time: number) {
  animationControlState.time = time;
  animate();
}
