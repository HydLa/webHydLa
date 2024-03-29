/**
 * サーバーとのやり取りをするためのコード
 * Hylagi にコードを送ったり、受け取ったデータを表示する
 */

import { startPreloader, stopPreloader, showToast, selectLogTab } from '../UI/dom';
import { sendEditorHydla } from '../editor/editor';
import { loadHydlaNameFromStorage } from '../storage';
import { loadHydat, HydatRaw } from '../hydat/hydat';

const firstScriptElement = document.getElementsByTagName('script')[0];
const htmlModeCheckBox = <HTMLInputElement>document.getElementById('html_mode_check_box');

class HyLaGIControllerState {
  static running = false;
  static dynamicScriptElements: HTMLElement[];
}

/* The type for the response from HyLaGI */
interface ResponseBody {
  error: number;
  hydat: HydatRaw;
  message: string;
  stdout: string;
  stderr: string;
}

export function initHyLaGIControllerState() {
  HyLaGIControllerState.dynamicScriptElements = [];
}

export function execHyLaGI() {
  if (HyLaGIControllerState.running) {
    killHyLaGI();
  } else {
    sendEditorHydla();
  }
}

/* 今は exec_icon は使われていない様子 */
export function updateHyLaGIExecIcon() {
  const runButton = <HTMLInputElement>document.getElementById('run_button');
  const elist = Array.from(document.getElementsByClassName('exec-icon'));
  if (HyLaGIControllerState.running) {
    runButton.value = 'KILL'; // for new UI
    for (const ei of elist) {
      ei.classList.remove('mdi-content-send');
      ei.classList.add('mdi-content-clear');
    }
  } else {
    runButton.value = 'RUN'; // for new UI
    for (const ei of elist) {
      ei.classList.add('mdi-content-send');
      ei.classList.remove('mdi-content-clear');
    }
  }
}

/* function to submit hydla code to server */
export async function sendHydla(hydla: string) {
  startPreloader();
  HyLaGIControllerState.running = true;
  updateHyLaGIExecIcon();

  const response = await fetch('start_session', {
    method: 'GET',
  });
  const text = await response.text();
  sendToHyLaGI(hydla);
}

export async function sendToHyLaGI(hydla: string) {
  /* build form data */
  const form = new FormData();
  form.append('hydla_code', hydla);
  form.append('hylagi_option', getOptionsValue());
  form.append('timeout_option', getTimeoutOption());

  const response = await fetch('hydat.cgi', {
    method: 'POST',
    body: form,
  });

  const res = await response;
  if (res.status !== 200) {
    const errorMessage = `Looks like there was a problem. Status Code: ${response.status}`;
    showToast(errorMessage, 3000, 'red darken-4');
    selectLogTab();
    console.log(errorMessage);
    return;
  }

  const responseText = await res.text();
  responseHyLaGI(JSON.parse(responseText));
}

/* 数字が入っている場合のみ timeout オプションの値を返す */
export function getTimeoutOption(): string {
  const timeoutOption = <HTMLInputElement>document.getElementById('timeout_option');
  if (!isNaN(parseInt(timeoutOption.value))) return timeoutOption.value;
  else return '30';
}

export function getOptionsValue(): string {
  let optionsValue = '';

  const phaseNum = <HTMLInputElement>document.getElementById('phase_num');
  const simulationTime = <HTMLInputElement>document.getElementById('simulation_time');
  const ndModeCheckBox = <HTMLInputElement>document.getElementById('nd_mode_check_box');
  const otherOptions = <HTMLInputElement>document.getElementById('other_options');

  if (!isNaN(parseInt(phaseNum.value))) optionsValue += ` -p ${phaseNum.value}`;
  if (!isNaN(parseInt(simulationTime.value))) optionsValue += ` -t ${simulationTime.value}`;
  if (isNaN(parseInt(phaseNum.value)) && isNaN(parseInt(simulationTime.value))) optionsValue += ' -p10';
  if (htmlModeCheckBox.checked) optionsValue += ' -d --fhtml ';
  if (ndModeCheckBox.checked) optionsValue += ' --fnd ';
  else optionsValue += ' --fno-nd ';
  if (otherOptions.value !== '') optionsValue += otherOptions.value;

  return optionsValue;
}

/* Response from HyLaGI */
export function responseHyLaGI(response: ResponseBody) {
  switch (response.error) {
    case 0:
      showToast('Simulation was successful.', 1000, '');
      if (response.hydat != undefined) {
        response.hydat.name = loadHydlaNameFromStorage()!;
        loadHydat(response.hydat);
      } else {
        selectLogTab();
      }
      break;
    default:
      if (HyLaGIControllerState.running) {
        showToast(`Error message: ${response.message}`, 3000, 'red darken-4');
        selectLogTab();
        console.error(response);
      } else {
        showToast('Killed HyLaGI', 1000, '');
      }
      break;
  }

  renderOutput(response);

  stopPreloader();
  HyLaGIControllerState.running = false;
  updateHyLaGIExecIcon();
}

export function renderOutput(response: ResponseBody) {
  const output = document.getElementById('output-initial')!;
  output.innerHTML = '';
  for (const elem of HyLaGIControllerState.dynamicScriptElements) {
    elem.parentNode!.removeChild(elem);
  }
  HyLaGIControllerState.dynamicScriptElements = [];

  if (htmlModeCheckBox.checked) {
    if (response.stdout != undefined) {
      output.innerHTML += response.stdout;
    }
    if (response.stderr != undefined) {
      output.innerHTML += response.stderr;
    }
    const scriptNodes = Array.from(output.getElementsByTagName('script'));
    for (const scriptNode of scriptNodes) {
      if (scriptNode.hasAttribute('src')) {
        continue;
      }
      const newScript = document.createElement('script');
      newScript.innerHTML = scriptNode.innerHTML;
      HyLaGIControllerState.dynamicScriptElements.push(
        firstScriptElement.parentNode!.insertBefore(newScript, firstScriptElement)
      );
    }
  } else {
    const getEscapedStringForHTML = (origString: string) =>
      origString.replace(/\n/gm, '<br/>').replace(/\s/gm, '&nbsp;');
    if (response.stdout != undefined) {
      output.innerHTML += getEscapedStringForHTML(response.stdout);
    }
    if (response.stderr != undefined) {
      output.innerHTML += getEscapedStringForHTML(response.stderr);
    }
  }
}

export async function killHyLaGI() {
  /* build form data */
  const response = await fetch('killer', {
    method: 'GET',
  });
  const responseText = await response.text();
  console.log(responseText);
  HyLaGIControllerState.running = false;
  updateHyLaGIExecIcon();
}
