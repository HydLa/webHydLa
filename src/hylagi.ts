import { startPreloader, stopPreloader, showToast, selectLogTab } from './dom_control';
import { sendEditorHydla } from './editor_control';
import { loadHydat } from './hydat_control';
import { loadHydlaNameFromStorage } from './storage_control';
import { HydatRaw } from './hydat';

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

export function updateHyLaGIExecIcon() {
  const runButton = <HTMLInputElement>document.getElementById('runButton');
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
export function sendHydla(hydla: string) {
  startPreloader();
  HyLaGIControllerState.running = true;
  updateHyLaGIExecIcon();

  const hr = new XMLHttpRequest();
  hr.open('GET', 'startSession');
  hr.send(null);

  hr.onload = () => {
    sendToHyLaGI(hydla);
  };
}

export function sendToHyLaGI(hydla: string) {
  /* build form data */
  const form = new FormData();
  form.append('hydlaCode', hydla);
  form.append('hylagiOption', getOptionsValue());
  form.append('timeoutOption', getTimeoutOption());

  const xmlhr = new XMLHttpRequest();
  xmlhr.open('POST', 'hydat.cgi');
  xmlhr.onload = () => {
    responseHyLaGI(JSON.parse(xmlhr.responseText));
  };
  xmlhr.send(form);
}

export function getTimeoutOption(): string {
  const timeoutOption = <HTMLInputElement>document.getElementById('timeoutOption');
  if (timeoutOption.value !== '') return timeoutOption.value;
  else return '30';
}

export function getOptionsValue(): string {
  let optionsValue = '';

  const phaseNum = <HTMLInputElement>document.getElementById('phaseNum');
  const simulationTime = <HTMLInputElement>document.getElementById('simulationTime');
  const ndModeCheckBox = <HTMLInputElement>document.getElementById('ndModeCheckBox');
  const otherOptions = <HTMLInputElement>document.getElementById('otherOptions');

  if (phaseNum.value !== '') optionsValue += ` -p ${phaseNum.value}`;
  if (simulationTime.value !== '') optionsValue += ` -t ${simulationTime.value}`;
  if (phaseNum.value === '' && simulationTime.value === '') optionsValue += ' -p10';
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

export function killHyLaGI() {
  /* build form data */
  const xmlhr = new XMLHttpRequest();
  xmlhr.open('GET', 'killer');
  xmlhr.send(null);
  HyLaGIControllerState.running = false;
  updateHyLaGIExecIcon();
}
