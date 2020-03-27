import { PlotLine } from "./plot_line";
import { PlotControl } from "./plot_control";
import { DOMControl } from "./dom_control";
import * as THREE from "three";
import { GraphControl } from "./graph_control";
import { HydatParameter, HydatParameterInterval, HydatPhase } from "./hydat";
import { RGB, Triplet } from "./plot_utils";
import { HydatControl } from "./hydat_control";
import { Construct, Constant } from "./parse";

export class AnimationControl {
  static maxlen: number = 0;
  /** ボールの軌道のリスト */
  static animation_line: { vecs: THREE.Vector3[], color: number }[] = [];

  static time: number = 0;
  static time_prev: number = -100;

  /** 描画したボールを登録しておく */
  static plot_animate: THREE.Mesh[];

  // 動的描画
  /** 何本の線を動的に追加したか */
  static line_count: number = 0;
  /** accumulative_merged_linesをどこまで追加したか */
  static amli: number = 0;
  /** 動的に描画したい線 */
  static dynamic_lines: any[][] = [];
  /**
   * 最適化のために各PPまでの線を累積マージして格納しておく<br>
   * accumulative_merged_lines[i][j]: i本目の線について2j+1フェーズ目までの線をマージした線
   */
  static accumulative_merged_lines: any[][] = [];
  /** sceneに追加された線を登録しておく */
  static drawn_dynamic_lines: any[][] = [];

  static add_plot(line: PlotLine) {
    var axes: Triplet<Construct>;
    if (line.settings.x == "" ||
      line.settings.y == "" ||
      line.settings.z == "") {
      return;
    }
    try {
      axes = new Triplet<Construct>(
        Construct.parse(line.settings.x),
        Construct.parse(line.settings.y),
        Construct.parse(line.settings.z)
      );
      line.updateFolder(true);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      line.updateFolder(false);
      return;
    }
    if (HydatControl.current_hydat === undefined) {
      throw new Error("current_hydat is undefined");
    }
    var dt = PlotControl.plot_settings.plotInterval;
    var phase = HydatControl.current_hydat.first_phases[0];
    var parameter_condition_list = PlotControl.divideParameter(HydatControl.current_hydat.parameters);
    const getColors = (colorNum: number, colorAngle: number) => {
      var angle = 360 / colorNum;
      var angle_start = Math.floor(colorAngle);
      var retColors: number[] = [];
      for (var i = 0; i < colorNum; i++) {
        retColors.push(RGB.fromHue((Math.floor(angle * i) + angle_start) % 360).asHex24());
      }
      return retColors;
    };
    let color = getColors(parameter_condition_list.length, line.color_angle);
    line.plot_information = { phase_index_array: [{ phase: phase, index: 0 }], axes: axes, line: line, width: PlotControl.plot_settings.lineWidth, color: color, dt: dt, parameter_condition_list: parameter_condition_list };
    DOMControl.startPreloader();
    PlotControl.array = -1;
    this.animation_line = [];
    this.maxlen = 0;
    if (line.plot_ready == undefined) requestAnimationFrame(function () { line.plotReady() });
  }

  /** startPosからendPosまで幅scaledWidthの線を作る */
  static make_line(startPos: THREE.Vector3, endPos: THREE.Vector3, scaledWidth: number, material: THREE.Material) {
    var directionVec = endPos.clone().sub(startPos);
    var height = directionVec.length();
    directionVec.normalize();
    var cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(scaledWidth, scaledWidth, height + scaledWidth, 8, 1), material);

    var upVec = new THREE.Vector3(0, 1, 0);
    var rotationAxis = upVec.clone().cross(directionVec).normalize();
    var rotationAngle = Math.acos(upVec.dot(directionVec));

    var newpos = startPos.clone().lerp(endPos, 0.5);
    cylinderMesh.position.set(newpos.x, newpos.y, newpos.z);
    cylinderMesh.setRotationFromAxisAngle(rotationAxis, rotationAngle);

    cylinderMesh.updateMatrix();
    return cylinderMesh;
  };

  static add_line(current_line_vec: { vec: THREE.Vector3, isPP: boolean }[], current_param_idx: number, line: PlotLine, width: number, color: number[]) {
    PlotControl.array += 1;

    var linesGeometry = new THREE.Geometry();
    let scaledWidth = 0.5 * width / GraphControl.camera.zoom;

    const dottedLength = 10.0 / GraphControl.camera.zoom;

    var tmp_dynamic_line: any[] = [];
    if (PlotControl.plot_settings.dynamicDraw) {
      if (AnimationControl.accumulative_merged_lines.length - 1 < PlotControl.array) AnimationControl.accumulative_merged_lines.push([]);
      if (AnimationControl.dynamic_lines.length - 1 < PlotControl.array) AnimationControl.dynamic_lines.push([]);
    }
    for (var i = 0; i + 1 < current_line_vec.length; i++) {
      if (current_line_vec[i + 1].isPP) {
        const posBegin = current_line_vec[i].vec;
        const posEnd = current_line_vec[i + 1].vec;
        let directionVec = posEnd.clone().sub(posBegin);
        const lineLength = directionVec.length();
        directionVec.normalize();
        const numOfDots = lineLength / dottedLength;
        let tmp_geometry = new THREE.Geometry();
        for (var j = 1; j + 1 < numOfDots; j += 2) { // 点線の各点を追加
          let l = AnimationControl.make_line(
            posBegin.clone().add(directionVec.clone().multiplyScalar(j * dottedLength)),
            posBegin.clone().add(directionVec.clone().multiplyScalar((j + 1) * dottedLength)),
            scaledWidth,
            new THREE.MeshBasicMaterial({ color: color[current_param_idx] })
          );
          if (PlotControl.plot_settings.dynamicDraw) tmp_geometry.merge(<any>l.geometry.clone(), l.matrix.clone());
          linesGeometry.merge(<any>l.geometry, l.matrix);
        }
        if (PlotControl.plot_settings.dynamicDraw) {
          let l: any = new THREE.Mesh(
            tmp_geometry,
            new THREE.MeshBasicMaterial({ color: color[current_param_idx] })
          );
          l.isPP = true;
          tmp_dynamic_line.push(l);

          AnimationControl.accumulative_merged_lines[PlotControl.array].push(
            new THREE.Mesh(
              linesGeometry.clone(),
              new THREE.MeshBasicMaterial({ color: color[current_param_idx] })
            )
          );
        }
      }
      else if (!current_line_vec[i].vec.equals(current_line_vec[i + 1].vec)) { // IPの各折れ線を追加
        let l = AnimationControl.make_line(current_line_vec[i].vec, current_line_vec[i + 1].vec, scaledWidth, new THREE.MeshBasicMaterial({ color: color[current_param_idx] }));
        if (PlotControl.plot_settings.dynamicDraw) tmp_dynamic_line.push(l);
        linesGeometry.merge(<any>l.geometry, l.matrix);
      }
    }
    if (PlotControl.plot_settings.dynamicDraw) AnimationControl.dynamic_lines[PlotControl.array] = tmp_dynamic_line;

    let three_line = new THREE.Mesh(
      linesGeometry,
      new THREE.MeshBasicMaterial({ color: color[current_param_idx] })
    );
    GraphControl.lineIDSet.add(three_line.id);
    if (!PlotControl.plot_settings.dynamicDraw) GraphControl.scene.add(three_line);

    if (!line.plot) {
      throw new Error("unexpected: line.plot is undefined");
    }
    line.plot.push(three_line);

    AnimationControl.animation_line[PlotControl.array] = {
      vecs: PlotControl.current_line_vec_animation,
      color: color[current_param_idx]
    };
    if (AnimationControl.maxlen < PlotControl.current_line_vec_animation.length) {
      AnimationControl.maxlen = PlotControl.current_line_vec_animation.length;
    }

    // 動く点
    let s_geometry = new THREE.SphereGeometry(0.1);
    let s_material = new THREE.MeshBasicMaterial({ color: color[current_param_idx] });
    let sphere = new THREE.Mesh(s_geometry, s_material);
    sphere.position.set(0, 0, 0);
    GraphControl.scene.add(sphere);
    AnimationControl.plot_animate[PlotControl.array] = (sphere);
  }

  /** dfs to add plot each line */
  static dfs_each_line(phase_index_array: { phase: HydatPhase, index: number }[], axes: Triplet<Construct>, line: PlotLine, width: number, color: number[], dt: number, parameter_condition_list: { [key: string]: Constant; }[], current_param_idx: number, current_line_vec: { vec: THREE.Vector3, isPP: boolean }[]) {
    try {
      while (true) {
        if (line.plot_ready) {
          line.plotting = false;
          console.log("Plot is interrupted");
          PlotControl.PlotStartTime = undefined;
          return;
        }

        // phase_index_array is used to implement dfs without function call.
        let phase_index = phase_index_array[phase_index_array.length - 1]; // top
        let phase = phase_index.phase;
        let vec = PlotControl.phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, dt);
        current_line_vec = current_line_vec.concat(vec);
        let vec_animation = PlotControl.phase_to_line_vectors(phase, parameter_condition_list[current_param_idx], axes, 0.01); // tを0.01刻みで点を取る -> time = t * 100
        // PlotControl.current_line_vec_animation = PlotControl.current_line_vec_animation.concat(vec_animation);
        for (let v of vec_animation) {
          PlotControl.current_line_vec_animation.push(v.vec);
        }
        if (phase.children.length == 0) { // on leaves
          AnimationControl.add_line(current_line_vec, current_param_idx, line, width, color);

          current_line_vec = [];
          PlotControl.current_line_vec_animation = [];
          phase_index_array.pop();
          phase_index = phase_index_array[phase_index_array.length - 1];
          ++(phase_index.index);
          phase = phase_index.phase;
        }
        while2: while (true) {
          // search next child to plot
          for (/* restart searching */; phase_index.index < phase.children.length; phase_index.index++) {
            var child = phase.children[phase_index.index];
            var included_by_parameter_condition = AnimationControl.check_parameter_condition(child.parameter_maps, parameter_condition_list[current_param_idx]);
            if (included_by_parameter_condition) { // パラメータに含まれるchild，つまり描画するべきchildが見つかった
              phase_index_array.push({ phase: child, index: 0 }); // start from 0th child
              var current_time = new Date().getTime();
              if (current_time - line.last_plot_time >= 200) { // interrupt searching
                line.last_plot_time = current_time;
                // use setTimeout to check event queue
                requestAnimationFrame(function () {
                  AnimationControl.dfs_each_line(phase_index_array, axes, line, width, color, dt, parameter_condition_list, current_param_idx, current_line_vec)
                });
                return;
              }
              break while2; // go to child
            }
          }

          // 以下，描画するべきchildが見つからなかった場合
          // Plot for this current_param_idx is completed.
          if (phase_index_array.length == 1) {
            if (current_param_idx == parameter_condition_list.length - 1) { // last
              // Plot is completed.
              line.plotting = false;
              PlotControl.checkAndStopPreloader();
              return;
            }
            else {
              // setTimeout(function()
              //             {dfs_each_line([{phase:phase_index_array[0].phase, index:0}], axes, line, width, color, dt, parameter_condition_list, current_param_idx, [])
              //             }, 0);
              // 次のparameter conditionで探索しなおす
              ++current_param_idx;
              phase_index_array[0].index = 0;
              break;
            }
          } else {
            // go to parent phase
            phase_index_array.pop();
            phase_index = phase_index_array[phase_index_array.length - 1];
            ++(phase_index.index);
            phase = phase_index.phase; // start from next sibling
          }
        }
      }
    }
    catch (ex) {
      console.log(ex);
      console.log(ex.stack);
      DOMControl.showToast("Plot failed: " + ex.name +
        "(" + ex.message + ")", 3000, "red darken-4");
      line.plotting = false;
      PlotControl.checkAndStopPreloader();
    }
  }

  static remove_plot(line: PlotLine) {
    if (line.plot !== undefined) {
      for (var i = 0; i < line.plot.length; i++) {
        GraphControl.scene.remove(line.plot[i]);
        GraphControl.lineIDSet.delete(line.plot[i].id);
      }
      delete line.plot[i];
    }
    line.plot = [];
  }

  static remove_mesh(line: THREE.Mesh[] | undefined) {
    if (line !== undefined) {
      for (let i = 0; i < line.length; i++) {
        GraphControl.scene.remove(line[i]);
        delete line[i];
      }
      line.length = 0;
    }
  }

  static reset(line: PlotLine) {
    AnimationControl.remove_plot(line);
    AnimationControl.remove_mesh(AnimationControl.plot_animate);
    AnimationControl.add_plot(line);
  }

  /** parameter_condition_listの値がparameter_mapsの範囲内にあるか */
  static check_parameter_condition(parameter_maps: { [key: string]: HydatParameter }[], parameter_condition_list: { [key: string]: Constant }) {
    let epsilon = 0.0001;
    for (let map of parameter_maps) {
      let included = true;
      for (let key in map) {
        let p = map[key];
        let c = parameter_condition_list[key];
        if (c === undefined) continue;
        if (p instanceof HydatParameterInterval) {
          const lb = p.lower_bounds[0].value.getValue(parameter_condition_list);
          const ub = p.upper_bounds[0].value.getValue(parameter_condition_list);
          if (!(lb <= c.getValue(parameter_condition_list) + epsilon
            && ub >= c.getValue(parameter_condition_list) - epsilon)) {
            included = false;
          }
        } else if (!(p.unique_value.getValue(parameter_condition_list) <= c.getValue(parameter_condition_list) + epsilon
          && p.unique_value.getValue(parameter_condition_list) >= c.getValue(parameter_condition_list) - epsilon)) {
          included = false;
        }
      }
      if (included) {
        return true;
      }
    }
    return false;
  }

  static range_make_all() {
    if (GraphControl.face_a != undefined) {
      AnimationControl.remove_mesh(GraphControl.face_a);
    }
    GraphControl.face_a = [];
    if (AnimationControl.animation_line.length != 0) {
      for (let j = 0; j < AnimationControl.animation_line.length - 1; j++) {
        var face_geometry = new THREE.Geometry();
        var time_r = 0;
        for (let i = 0; i < AnimationControl.maxlen; i++) {
          if (AnimationControl.animation_line[j].vecs[time_r] == undefined) {
            break;
          } else if (AnimationControl.animation_line[j + 1].vecs[time_r] == undefined) {
            break;
          } else {
            face_geometry.vertices.push(new THREE.Vector3(AnimationControl.animation_line[j].vecs[time_r].x, AnimationControl.animation_line[j].vecs[time_r].y, AnimationControl.animation_line[j].vecs[time_r].z));
            face_geometry.vertices.push(new THREE.Vector3(AnimationControl.animation_line[j + 1].vecs[time_r].x, AnimationControl.animation_line[j + 1].vecs[time_r].y, AnimationControl.animation_line[j + 1].vecs[time_r].z));
          }
          time_r++;
        }
        for (let k = 0; k < face_geometry.vertices.length - 2; k++) {
          face_geometry.faces.push(new THREE.Face3(k, (k + 1), (k + 2)));
        }
        face_geometry.computeFaceNormals();
        face_geometry.computeVertexNormals();
        let face_all = new THREE.Mesh(face_geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: true, transparent: true, side: THREE.DoubleSide, opacity: 0.5 }));
        GraphControl.scene.add(face_all);
        GraphControl.face_a.push(face_all);
      }
      GraphControl.render_three_js();
    }
  }

  /** i番目のdynamic lineを消す */
  static remove_ith_dynamic_line(i: number) {
    for (var l of AnimationControl.drawn_dynamic_lines[i]) {
      GraphControl.scene.remove(l);
    }
    AnimationControl.drawn_dynamic_lines[i] = [];
  }

  /** 全てのdynamic lineを消す */
  static remove_dynamic_lines() {
    for (var i = 0; i < AnimationControl.drawn_dynamic_lines.length; i++) {
      AnimationControl.remove_ith_dynamic_line(i);
    }
    AnimationControl.drawn_dynamic_lines = [];
  }

  /** 現在時刻以下の線をsceneに追加する */
  static draw_dynamic_lines() {
    var tmp_line_count = this.line_count;
    var tmp_amli = this.amli;
    for (var i = 0; i < AnimationControl.dynamic_lines.length; i++) {
      if (AnimationControl.drawn_dynamic_lines.length - 1 < i) AnimationControl.drawn_dynamic_lines.push([]);
      tmp_line_count = this.line_count;
      tmp_amli = this.amli;
      for (var j = tmp_line_count; j < AnimationControl.dynamic_lines[i].length; j++) { // 差分のみ追加
        if ('isPP' in AnimationControl.dynamic_lines[i][j]) { // PP
          // これまで追加した線を取り除き，代わりにマージ済みの線を追加する
          AnimationControl.remove_ith_dynamic_line(i);
          GraphControl.scene.add(AnimationControl.accumulative_merged_lines[i][tmp_amli]);
          AnimationControl.drawn_dynamic_lines[i].push(AnimationControl.accumulative_merged_lines[i][tmp_amli]);
          tmp_amli++;
        } else if (j < this.time) { // IP
          GraphControl.scene.add(AnimationControl.dynamic_lines[i][j]);
          AnimationControl.drawn_dynamic_lines[i].push(AnimationControl.dynamic_lines[i][j]);
        } else { // timeより未来の線は書かない
          break;
        }
        tmp_line_count++;
      }
    }
    this.line_count = tmp_line_count;
    this.amli = tmp_amli;
  }

  /**
   * ボールの位置を動的に変更して動いているように見せる
   * dynamic drawモードなら線も動的に追加する
   */
  static animate() {
    if (this.time_prev !== this.time) {
      AnimationControl.plot_animate = [];
      let arr = 0;
      if (this.time > AnimationControl.maxlen - 1) {
        this.time = 0;
      }
      for (let sphere of GraphControl.scene.children) {
        if (AnimationControl.animation_line[arr] === undefined) {
          continue;
        }

        if (!(sphere instanceof THREE.Mesh)) continue;
        if (!(sphere.material instanceof THREE.MeshBasicMaterial)) {
          console.error("unexpected: !(sphere.material instanceof THREE.MeshBasicMaterial)")
          continue;
        }
        if (!(sphere.geometry instanceof THREE.SphereGeometry)) continue;
        if (this.time === 0) {
          sphere.material.color.set(
            AnimationControl.animation_line[arr].color
          );
        }
        if (this.time > AnimationControl.animation_line[arr].vecs.length - 1) {
          arr++;
          continue;
        }
        sphere.position.set(
          AnimationControl.animation_line[arr].vecs[this.time].x,
          AnimationControl.animation_line[arr].vecs[this.time].y,
          AnimationControl.animation_line[arr].vecs[this.time].z);
        AnimationControl.plot_animate[arr] = sphere;
        arr += 1;
      }

      if (PlotControl.plot_settings.dynamicDraw) {
        if (this.time == 0) {
          AnimationControl.remove_dynamic_lines();
          this.line_count = 0;
          this.amli = 0;
        }
        AnimationControl.draw_dynamic_lines();
      }

      this.time_prev = this.time;
      GraphControl.render_three_js();
    }
  }

  static animateTime() {
    this.time++;
  }

  static getLength() {
    return this.animation_line.length;
  }
}
