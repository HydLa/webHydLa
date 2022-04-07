/**
 * webHydLa の下部のグラフの描画を行う
 */
import { Console } from 'console';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { HydatParameter, HydatParameterInterval, HydatPhase, HydatState } from '../hydat/hydat';
import { Constant, Construct, ParamCond, parse } from '../hydat/parse';
import { showToast, startPreloader } from '../UI/dom';

import { MultiBiMap } from './animationUtils';
import { graphState, renderGraphThreeJs } from './graph';
import { checkAndStopPreloader, phaseToLineVectors, resetPlotStartTime } from './plot';
import { PlotLine, plotReady, updateFolder } from './plotLine';
import { PlotSettingsControl } from './plotSettings';
import { RGB, Triplet } from './plotUtils';

let faces: THREE.Mesh[];

/**
 * 描画用オブジェクトの計算，描画，削除を担当
 */
interface AnimationState {
  array: number;
  currentLineVecAnimation: THREE.Vector3[];
  maxlen: number;
  /** ボールの軌道のリスト */
  animationLine: { vecs: THREE.Vector3[]; color: number }[];

  /** 描画におけるグローバル時間 */
  time: number;
  timePrev: number;

  /** 描画したボールを登録しておく */
  plotAnimate: THREE.Mesh[];

  // 動的描画
  /** 何本の線を動的に追加したか */
  lineCount: number;
  /** 動的に描画したい線 */
  dynamicLines: any[][];
  /** sceneに追加された線を登録しておく */
  drawnDynamicLines: any[][];

  /**
   * 最適化のために各PPまでの線を累積マージして格納しておく<br>
   * accumulativeMergedLines[i][j]:
   * i本目の線について2j+1フェーズ目までの線をマージした線
   */
  accumulativeMergedLines: any[][];
  /** accumulativeMergedLinesをどこまで追加したか */
  amli: number;

  /** PlotLine.indexとPlotControl.arrayの対応 */
  indexArrayMultibimap: MultiBiMap<number, number>;
}

export const animationState: AnimationState = {
  array: -1,
  currentLineVecAnimation: [],
  maxlen: 0,
  animationLine: [],
  time: 0,
  timePrev: -100,
  plotAnimate: [],
  lineCount: 0,
  dynamicLines: [],
  drawnDynamicLines: [],
  accumulativeMergedLines: [],
  amli: 0,
  indexArrayMultibimap: new MultiBiMap<number, number>(),
};

/**
 * colorAngleを起点にして、色相をcolorNum個に等分し、
 * 各点の色を16進6桁の配列で返す
 */
function getColors(colorNum: number, colorAngle: number) {
  const angle = 360 / colorNum;
  const angleStart = Math.floor(colorAngle);
  const retColors: number[] = [];
  for (let i = 0; i < colorNum; i++) {
    retColors.push(RGB.fromHue((Math.floor(angle * i) + angleStart) % 360).asHex24());
  }
  return retColors;
}

/**
 * animationState に line を追加する
 */
function addPlot(line: PlotLine) {
  let axes: Triplet<Construct>;
  if (line.settings.x == '' || line.settings.y == '' || line.settings.z == '') {
    return;
  }
  try {
    axes = new Triplet<Construct>(parse(line.settings.x), parse(line.settings.y), parse(line.settings.z));
    updateFolder(line, true);
  } catch (e) {
    if (e instanceof TypeError) {
      console.log(e);
      console.log(e.stack);
    }
    updateFolder(line, false);
    return;
  }
  if (HydatState.currentHydat === undefined) {
    throw new Error('currentHydat is undefined');
  }
  const dt = PlotSettingsControl.plotSettings.plotInterval;
  const phase = HydatState.currentHydat.firstPhases[0];
  const parameterConditionList = divideParameter(HydatState.currentHydat.parameters);
  const color = getColors(parameterConditionList.length, line.colorAngle);
  line.plotInformation = {
    phaseIndexArray: [{ phase: phase, index: 0 }],
    axes: axes,
    line: line,
    width: PlotSettingsControl.plotSettings.lineWidth,
    color: color,
    dt: dt,
    parameterConditionList: parameterConditionList,
  };
  startPreloader();
  animationState.array = -1;
  animationState.animationLine = [];
  animationState.maxlen = 0;
  if (line.plotReady == undefined)
    requestAnimationFrame(() => {
      plotReady(line);
    });
}

/**
 * fixed が false の時に指定された本数（= n）のグラフを生成するために, 各パラメタの値を n 分割して各グラフに割り当てる
 */
function divideParameter(parameterMap: Map<string, HydatParameter>) {
  let nowParameterConditionList: ParamCond[] = [new Map()];

  for (const parameterName of parameterMap.keys()) {
    const setting = PlotSettingsControl.plotSettings.parameterCondition!.get(parameterName)!;
    if (setting.fixed) {
      for (const nowParamCond of nowParameterConditionList) {
        const parameterValue = setting.value;
        nowParamCond.set(parameterName, new Constant(parameterValue));
      }
    } else {
      const lb = setting.minValue;
      const ub = setting.maxValue;
      const div = Math.floor(setting.value);
      const nextParameterConditionList = [];
      let deltaP;
      if (div == 1) {
        deltaP = ub - lb;
      } else {
        deltaP = (ub - lb) / (div - 1);
      }
      for (const nowParamCond of nowParameterConditionList) {
        for (let j = 0; j < div; j++) {
          const parameterValue = lb + j * deltaP;
          const tmpObj = new Map([...nowParamCond]);
          tmpObj.set(parameterName, new Constant(parameterValue));
          nextParameterConditionList.push(tmpObj);
        }
      }
      nowParameterConditionList = nextParameterConditionList;
    }
  }
  return nowParameterConditionList;
}

/**
 * startPos から endPos まで幅 scaledWidth の線を cylinderGeometry で作って返す，
 * makeLine に対応する関数．
 * makeLine と違って，Line を使わないのは Line の太さが変わらないバグがあるため．
 * https://threejs.org/docs/#api/en/materials/LineBasicMaterial.linewidth
 */
function makeCylinder(startPos: THREE.Vector3, endPos: THREE.Vector3, scaledWidth: number) {
  // startPos から endPos へ向かうベクタ
  const directionVec = endPos.clone().sub(startPos);
  const height = directionVec.length();

  // 長さ height + scaledWidth，上下の半径が scaledWidth の正八角柱を作る
  // 初期状態で y 軸正方向を向いている
  const cylinder = new THREE.CylinderGeometry(scaledWidth, scaledWidth, height + scaledWidth, 8, 1);

  // y 軸正から z 軸正へ向けて xRotationAngle だけ回転し、
  // その後 z 軸正から x 軸正 へ向けて yRotationAngle だけ回転させたい
  // ここで 0 <= acosθ <= π,  -π < atanθ < π に注意
  // xRotationAngle は acosθ の範囲で充分だが、yRotationAngle は 1
  // 周分必要だから補う必要がある
  //   - directionVec.z >  0 のときはそのままの値を使えば良い
  //   - directionVec.z <  0 のときは π を足すことで向こう半周分を補足
  //   - directionVec.z == 0 のときは
  //     - directionVec.x > 0 ならば π/2 、さもなくば -π/2
  // とすることで 1 周分を確保した
  // あとは三項演算子が煩雑にならないよう適宜分けて記述してある
  const yVec = new THREE.Vector3(0, 1, 0);
  directionVec.normalize();
  const xRotationAngle = Math.acos(yVec.dot(directionVec));
  const yVerticalAngle = directionVec.x > 0 ? Math.PI / 2 : -Math.PI / 2;
  const yRotationAngle = directionVec.z === 0 ? yVerticalAngle : Math.atan(directionVec.x / directionVec.z);

  cylinder.rotateX(xRotationAngle);
  cylinder.rotateY(directionVec.z < 0 ? yRotationAngle + Math.PI : yRotationAngle);

  // startPos と endPos の間の中間地点へ cylinder を平行移動する
  const newpos = startPos.clone().lerp(endPos, 0.5);
  cylinder.translate(...newpos.toArray());

  return cylinder;
}

/**
 * グラフを描画する際の線．
 * 太さが 1 の場合は，thinLines を用いて，
 * そうでない場合は thickLines を用いる．
 * - TODO: これらを両方用いることはないので variant type っぽくしたい
 */
interface Lines {
  thinLines: THREE.Vector3[];
  thickLines: THREE.BufferGeometry | null;
}

/**
 * animationState に線を追加する．
 */
function addLine(
  currentLineVec: { vec: THREE.Vector3; isPP: boolean }[],
  color: number,
  line: PlotLine,
  width: number
) {
  // width が 1 の場合は Lines.thinLines を用いることになる．
  const useLine = width === 1;
  animationState.array += 1;

  animationState.indexArrayMultibimap.set(line.index, animationState.array);

  const scaledWidth = (0.5 * width) / graphState.camera.zoom;
  const dottedLength = 10.0 / graphState.camera.zoom;
  const material = useLine
    ? new THREE.LineBasicMaterial({ color: color })
    : new THREE.MeshBasicMaterial({ color: color });

  const tmpDynamicLine: any[] = [];
  if (PlotSettingsControl.plotSettings.dynamicDraw) {
    if (animationState.accumulativeMergedLines.length - 1 < animationState.array) {
      animationState.accumulativeMergedLines.push([]);
    }
    if (animationState.dynamicLines.length - 1 < animationState.array) {
      animationState.dynamicLines.push([]);
    }
  }
  const lines = { thinLines: [], thickLines: null };
  // グラフの曲線を細切れの直線に分割してそれらを繋げ合わせていく
  for (let i = 0; i + 1 < currentLineVec.length; i++) {
    addLineEachPhase(
      currentLineVec[i].vec,
      currentLineVec[i + 1].vec,
      currentLineVec[i + 1].isPP,
      scaledWidth,
      dottedLength,
      useLine,
      lines,
      tmpDynamicLine,
      material
    );
  }
  if (PlotSettingsControl.plotSettings.dynamicDraw) {
    animationState.dynamicLines[animationState.array] = tmpDynamicLine;
  }
  const threeLine = useLine ? makeLine(lines.thinLines, material, true) : new THREE.Mesh(lines.thickLines!, material);
  if (!PlotSettingsControl.plotSettings.dynamicDraw) {
    graphState.scene.add(threeLine);
  }

  if (!line.plot) {
    throw new Error('unexpected: line.plot is undefined');
  }
  line.plot.push(threeLine);

  animationState.animationLine[animationState.array] = {
    vecs: animationState.currentLineVecAnimation,
    color: color,
  };
  if (animationState.maxlen < animationState.currentLineVecAnimation.length) {
    animationState.maxlen = animationState.currentLineVecAnimation.length;
  }
}

/**
 * animationState に PP や IP それぞれのための線を追加する
 */
function addLineEachPhase(
  posBegin: THREE.Vector3,
  posEnd: THREE.Vector3,
  endIsPP: boolean,
  scaledWidth: number,
  dottedLength: number,
  useLine: boolean,
  lines: Lines,
  tmpDynamicLine: any[],
  material: THREE.Material
) {
  if (endIsPP) {
    const directionVec = posEnd.clone().sub(posBegin);
    const lineLength = directionVec.length();
    directionVec.normalize();
    const numOfDots = lineLength / dottedLength;
    const tmpGeometry = [];
    for (let j = 1; j + 1 < numOfDots; j += 2) {
      // 点線の各点を追加
      const tmpBegin = posBegin.clone().add(directionVec.clone().multiplyScalar(j * dottedLength));
      const tmpEnd = posBegin.clone().add(directionVec.clone().multiplyScalar((j + 1) * dottedLength));
      if (useLine) {
        lines.thinLines.push(tmpBegin, tmpEnd);
      } else {
        const l = makeCylinder(tmpBegin, tmpEnd, scaledWidth);
        if (PlotSettingsControl.plotSettings.dynamicDraw) {
          tmpGeometry.push(l.clone());
        }
        if (lines.thickLines) {
          lines.thickLines = mergeBufferGeometries([lines.thickLines, l]);
        } else {
          lines.thickLines = l;
        }
      }
    }
    if (PlotSettingsControl.plotSettings.dynamicDraw) {
      const l: any = useLine
        ? makeLine([posBegin, posEnd], material)
        : new THREE.Mesh(!tmpGeometry ? mergeBufferGeometries(tmpGeometry) : new THREE.BufferGeometry(), material);
      l.isPP = true;
      tmpDynamicLine.push(l);

      animationState.accumulativeMergedLines[animationState.array].push(
        useLine
          ? makeLine(lines.thinLines.concat(), material, true)
          : new THREE.Mesh(lines.thickLines!.clone(), material)
      );
    }
  } else if (!posBegin.equals(posEnd)) {
    // IPの各折れ線を追加
    if (useLine) {
      if (PlotSettingsControl.plotSettings.dynamicDraw) {
        const l = makeLine([posBegin, posEnd], material);
        tmpDynamicLine.push(l);
      }
      lines.thinLines.push(posBegin, posEnd);
    } else {
      const l = makeCylinder(posBegin, posEnd, scaledWidth);
      if (PlotSettingsControl.plotSettings.dynamicDraw) {
        tmpDynamicLine.push(new THREE.Mesh(l, material));
      }
      if (lines.thickLines) {
        lines.thickLines = mergeBufferGeometries([lines.thickLines, l]);
      } else {
        // lines.thickLines は最初は null なので，ここでまずは初期化してやる
        lines.thickLines = l;
      }
    }
  }
}

/**
 * 太さが変わらないバグはあるものの，軽量なので太さが 1 で良い時は Line を使う
 */
function makeLine(points: THREE.Vector3[], material: THREE.Material, segments = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  if (segments) return new THREE.LineSegments(geometry, material);
  else return new THREE.Line(geometry, material);
}

/**
 * animationState に球を追加する
 */
function addSphere(color: number) {
  const sGeometry = new THREE.SphereBufferGeometry(0.1);
  const sphere = new THREE.Mesh(sGeometry, new THREE.MeshBasicMaterial({ color: color }));
  sphere.position.set(0, animationState.array, 0);
  graphState.scene.add(sphere);
  animationState.plotAnimate[animationState.array] = sphere;
}

/** dfs to add plot each line */
export function dfsEachLine(
  phaseIndexArray: { phase: HydatPhase; index: number }[],
  axes: Triplet<Construct>,
  line: PlotLine,
  width: number,
  color: number[],
  dt: number,
  parameterConditionList: ParamCond[],
  currentParamIdx: number,
  currentLineVec: { vec: THREE.Vector3; isPP: boolean }[]
) {
  try {
    for (;;) {
      if (line.plotReady) {
        line.plotting = false;
        console.log('Plot is interrupted');
        resetPlotStartTime();
        return;
      }

      // phaseIndexArray is used to implement dfs without function call.
      let phaseIndex = phaseIndexArray[phaseIndexArray.length - 1]; // top
      let phase = phaseIndex.phase;
      const vec = phaseToLineVectors(phase, parameterConditionList[currentParamIdx], axes, dt);
      currentLineVec = currentLineVec.concat(vec);
      const vecAnimation = phaseToLineVectors(phase, parameterConditionList[currentParamIdx], axes, 0.01); // tを0.01刻みで点を取る -> time = t * 100
      // animationState.currentLineVecAnimation =
      // animationState.currentLineVecAnimation.concat(vecAnimation);
      for (const v of vecAnimation) {
        animationState.currentLineVecAnimation.push(v.vec);
      }
      if (phase.children.length == 0) {
        // on leaves
        addLine(currentLineVec, color[currentParamIdx], line, width);
        addSphere(color[currentParamIdx]);

        currentLineVec = [];
        animationState.currentLineVecAnimation = [];
        phaseIndexArray.pop();
        phaseIndex = phaseIndexArray[phaseIndexArray.length - 1];
        ++phaseIndex.index;
        phase = phaseIndex.phase;
      }
      let finished: boolean;
      [currentParamIdx, finished] = searchNextChild(
        phaseIndexArray,
        axes,
        line,
        width,
        color,
        dt,
        parameterConditionList,
        currentParamIdx,
        currentLineVec,
        phaseIndex,
        phase
      );
      if (finished) return;
    }
  } catch (ex) {
    if (ex instanceof Error) {
      console.log(ex);
      console.log(ex.stack);
      showToast(`Plot failed: ${ex.name}(${ex.message})`, 3000, 'red darken-4');
    }
    line.plotting = false;
    checkAndStopPreloader();
  }
}

function searchNextChild(
  phaseIndexArray: { phase: HydatPhase; index: number }[],
  axes: Triplet<Construct>,
  line: PlotLine,
  width: number,
  color: number[],
  dt: number,
  parameterConditionList: ParamCond[],
  currentParamIdx: number,
  currentLineVec: { vec: THREE.Vector3; isPP: boolean }[],
  phaseIndex: { phase: HydatPhase; index: number },
  phase: HydatPhase
): [number, boolean] {
  for (;;) {
    // search next child to plot
    for (; /* restart searching */ phaseIndex.index < phase.children.length; phaseIndex.index++) {
      const child = phase.children[phaseIndex.index];
      const includedByParameterCondition = checkParameterCondition(
        child.parameterMaps,
        parameterConditionList[currentParamIdx]
      );
      if (includedByParameterCondition) {
        // パラメータに含まれるchild，つまり描画するべきchildが見つかった
        phaseIndexArray.push({ phase: child, index: 0 }); // start from 0th child
        const currentTime = new Date().getTime();
        if (currentTime - line.lastPlotTime >= 200) {
          // interrupt searching
          line.lastPlotTime = currentTime;
          // use setTimeout to check event queue
          requestAnimationFrame(function () {
            dfsEachLine(
              phaseIndexArray,
              axes,
              line,
              width,
              color,
              dt,
              parameterConditionList,
              currentParamIdx,
              currentLineVec
            );
          });
          return [currentParamIdx, true];
        }
        return [currentParamIdx, false]; // go to child
      }
    }

    // 以下，描画するべきchildが見つからなかった場合
    // Plot for this currentParamIdx is completed.
    if (phaseIndexArray.length == 1) {
      if (currentParamIdx == parameterConditionList.length - 1) {
        // last
        // Plot is completed.
        line.plotting = false;
        checkAndStopPreloader();
        return [currentParamIdx, true];
      } else {
        // 次のparameter conditionで探索しなおす
        ++currentParamIdx;
        phaseIndexArray[0].index = 0;
        return [currentParamIdx, false];
      }
    } else {
      // go to parent phase
      phaseIndexArray.pop();
      phaseIndex = phaseIndexArray[phaseIndexArray.length - 1];
      ++phaseIndex.index;
      phase = phaseIndex.phase; // start from next sibling
    }
  }
}

export function removePlot(line: PlotLine) {
  if (line.plot !== undefined) {
    let i: number;
    for (i = 0; i < line.plot.length; i++) {
      graphState.scene.remove(line.plot[i]);
    }
  }
  animationState.indexArrayMultibimap.deleteKey(line.index);
  line.plot = [];
}

function removeMesh(spheres: THREE.Mesh[] | undefined) {
  if (spheres !== undefined) {
    for (let i = 0; i < spheres.length; i++) {
      graphState.scene.remove(spheres[i]);
    }
    spheres = [];
  }
}

export function resetAnimation(line: PlotLine) {
  removePlot(line);
  removeMesh(animationState.plotAnimate);
  addPlot(line);
}

/** parameterConditionListの値がparameterMapsの範囲内にあるか */
function checkParameterCondition(parameterMaps: Map<string, HydatParameter>[], parameterCondition: ParamCond) {
  const epsilon = 0.0001;
  for (const map of parameterMaps) {
    let included = true;
    for (const [key, p] of map) {
      const c = parameterCondition.get(key);
      if (c === undefined) continue;
      if (p instanceof HydatParameterInterval) {
        const lb = p.lowerBound.value.getValue(parameterCondition);
        const ub = p.upperBound.value.getValue(parameterCondition);
        if (!(lb <= c.getValue(parameterCondition) + epsilon && ub >= c.getValue(parameterCondition) - epsilon)) {
          included = false;
        }
      } else if (
        !(
          p.uniqueValue.getValue(parameterCondition) <= c.getValue(parameterCondition) + epsilon &&
          p.uniqueValue.getValue(parameterCondition) >= c.getValue(parameterCondition) - epsilon
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
  removeRanges();
  faces = [];
  if (animationState.animationLine.length != 0) {
    for (let j = 0; j < animationState.animationLine.length - 1; j++) {
      const points = new Array<THREE.Vector3>();
      const faceGeometry = new THREE.BufferGeometry();
      let timeR = 0;
      for (let i = 0; i < animationState.maxlen; i++) {
        if (animationState.animationLine[j].vecs[timeR] == undefined) {
          break;
        } else if (animationState.animationLine[j + 1].vecs[timeR] == undefined) {
          break;
        } else {
          points.push(
            animationState.animationLine[j].vecs[timeR].clone(),
            animationState.animationLine[j + 1].vecs[timeR].clone()
          );
        }
        timeR++;
      }
      faceGeometry.setFromPoints(points);
      faceGeometry.computeVertexNormals();
      const faceMesh = new THREE.Mesh(
        faceGeometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          depthTest: true,
          transparent: true,
          side: THREE.DoubleSide,
          opacity: 0.5,
        })
      );
      graphState.scene.add(faceMesh);
      faces.push(faceMesh);
    }
    renderGraphThreeJs();
  }
}

/** i番目のdrawn dynamic lineを消す */
function removeIthDrawnDynamicLine(i: number) {
  for (const l of animationState.drawnDynamicLines[i]) {
    graphState.scene.remove(l);
  }
  animationState.drawnDynamicLines[i] = [];
}

/** 全てのdrawn dynamic lineを消す */
function removeDrawnDynamicLines() {
  for (let i = 0; i < animationState.drawnDynamicLines.length; i++) {
    removeIthDrawnDynamicLine(i);
  }
  animationState.drawnDynamicLines = [];
}

function removeIthDynamicLine(i: number) {
  removeIthDrawnDynamicLine(i);
  animationState.dynamicLines[i] = [];
  animationState.accumulativeMergedLines[i] = [];
  animationState.indexArrayMultibimap.deleteValue(i);
}

export function removeDynamicLine(line: PlotLine) {
  if (animationState.indexArrayMultibimap.hasKey(line.index)) {
    const values = animationState.indexArrayMultibimap.getValue(line.index);
    values.forEach((i) => removeIthDynamicLine(i));
  }
}

export function removeDynamicLines() {
  for (let i = 0; i < animationState.drawnDynamicLines.length; i++) {
    removeIthDynamicLine(i);
  }
  animationState.dynamicLines = [];
  animationState.accumulativeMergedLines = [];
}

export function removeRanges() {
  if (faces != undefined) {
    removeMesh(faces);
  }
  renderGraphThreeJs();
}

/** 現在時刻以下の線をsceneに追加する */
function drawDynamicLines() {
  let tmpLineCount = animationState.lineCount;
  let tmpAmli = animationState.amli;
  for (let i = 0; i < animationState.dynamicLines.length; i++) {
    if (animationState.dynamicLines[i].length == 0) continue;
    if (animationState.drawnDynamicLines.length - 1 < i) animationState.drawnDynamicLines.push([]);
    tmpLineCount = animationState.lineCount;
    tmpAmli = animationState.amli;
    for (let j = tmpLineCount; j < animationState.dynamicLines[i].length; j++) {
      // 差分のみ追加
      if ('isPP' in animationState.dynamicLines[i][j]) {
        // PP
        // これまで追加した線を取り除き，代わりにマージ済みの線を追加する
        removeIthDrawnDynamicLine(i);
        graphState.scene.add(animationState.accumulativeMergedLines[i][tmpAmli]);
        animationState.drawnDynamicLines[i].push(animationState.accumulativeMergedLines[i][tmpAmli]);
        tmpAmli++;
      } else if (j + 1 < animationState.time) {
        // IP
        graphState.scene.add(animationState.dynamicLines[i][j]);
        animationState.drawnDynamicLines[i].push(animationState.dynamicLines[i][j]);
      } else {
        // timeより未来の線は書かない
        break;
      }
      tmpLineCount++;
    }
  }
  animationState.lineCount = tmpLineCount;
  animationState.amli = tmpAmli;
}

/**
 * ボールの位置を動的に変更して動いているように見せる
 * dynamic drawモードなら線も動的に追加する
 */
export function animate() {
  if (animationState.timePrev !== animationState.time) {
    animationState.plotAnimate = [];
    let arr = 0;
    if (animationState.time > animationState.maxlen - 1) {
      animationState.time = 0;
    }
    for (const sphere of graphState.scene.children) {
      if (animationState.animationLine[arr] === undefined) {
        continue;
      }

      if (!(sphere instanceof THREE.Mesh)) continue;
      if (!(sphere.material instanceof THREE.MeshBasicMaterial)) {
        console.error('unexpected: !(sphere.material instanceof THREE.MeshBasicMaterial)');
        continue;
      }
      if (!(sphere.geometry instanceof THREE.SphereBufferGeometry)) continue;
      if (animationState.time === 0) {
        sphere.material.color.set(animationState.animationLine[arr].color);
      }
      if (animationState.time > animationState.animationLine[arr].vecs.length - 1) {
        animationState.plotAnimate[arr] = sphere;
        arr++;
        continue;
      }
      if (animationState.indexArrayMultibimap.hasValue(arr)) {
        sphere.position.copy(animationState.animationLine[arr].vecs[animationState.time]);
      } else {
        sphere.position.set(0, 0, 0);
      }
      animationState.plotAnimate[arr] = sphere;
      arr += 1;
    }

    if (PlotSettingsControl.plotSettings.dynamicDraw) {
      if (animationState.time == 0) {
        removeDrawnDynamicLines();
        animationState.lineCount = 0;
        animationState.amli = 0;
      }
      drawDynamicLines();
    }

    animationState.timePrev = animationState.time;
    renderGraphThreeJs();
  }
}

export function animateTime() {
  animationState.time++;
}

export function getLength() {
  return animationState.animationLine.length;
}

/** 指定時刻にシーク（移動）する */
export function seekAnimation(time: number) {
  animationState.time = time;
  animate();
}
