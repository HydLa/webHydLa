import { startPreloader, stopPreloader, showToast, selectLogTab } from './dom_control';
import { sendEditorHydla } from './editor_control';
import { loadHydat } from './hydat_control';
import { StorageControl } from './storage_control';

const first_script_element = document.getElementsByTagName('script')[0];
const html_mode_check_box = <HTMLInputElement>document.getElementById('html_mode_check_box');

class HyLaGIControllerState {
  static running = false;
  static dynamic_script_elements: HTMLElement[];
}

export function initHyLaGIControllerState() {
  HyLaGIControllerState.dynamic_script_elements = [];
}

export function execHyLaGI() {
  if (HyLaGIControllerState.running) {
    killHyLaGI();
  } else {
    sendEditorHydla();
  }
}

export function updateHyLaGIExecIcon() {
  const run_button = <HTMLInputElement>document.getElementById('run_button');
  const elist = Array.from(document.getElementsByClassName('exec-icon'));
  if (HyLaGIControllerState.running) {
    run_button.value = 'KILL'; // for new UI
    for (const ei of elist) {
      ei.classList.remove('mdi-content-send');
      ei.classList.add('mdi-content-clear');
    }
  } else {
    run_button.value = 'RUN'; // for new UI
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
  hr.open('GET', 'start_session');
  hr.send(null);

  hr.onload = () => {
    /* build form data */
    const form = new FormData();
    form.append('hydla_code', hydla);
    let options_value = '';
    const phase_num = <HTMLInputElement>document.getElementById('phase_num');
    const simulation_time = <HTMLInputElement>document.getElementById('simulation_time');
    const nd_mode_check_box = <HTMLInputElement>document.getElementById('nd_mode_check_box');
    const other_options = <HTMLInputElement>document.getElementById('other_options');
    const timeout_option = <HTMLInputElement>document.getElementById('timeout_option');
    if (phase_num.value !== '') options_value += ' -p ' + phase_num.value;
    if (simulation_time.value !== '') options_value += ' -t ' + simulation_time.value;
    if (phase_num.value === '' && simulation_time.value === '') options_value += ' -p10';
    if (html_mode_check_box.checked) options_value += ' -d --fhtml ';
    if (nd_mode_check_box.checked) options_value += ' --fnd ';
    else options_value += ' --fno-nd ';
    if (other_options.value !== '') options_value += other_options.value;
    form.append('hylagi_option', options_value);
    let timeout_value = '';
    if (timeout_option.value !== '') timeout_value = timeout_option.value;
    else timeout_value = '30';
    form.append('timeout_option', timeout_value);
    const xmlhr = new XMLHttpRequest();
    xmlhr.open('POST', 'hydat.cgi');
    xmlhr.onload = () => {
      const response = JSON.parse(xmlhr.responseText);

      switch (response.error) {
        case 0:
          showToast('Simulation was successful.', 1000, '');
          if (response.hydat != undefined) {
            response.hydat.name = StorageControl.loadHydlaName();
            loadHydat(response.hydat);
          } else {
            selectLogTab();
          }
          break;
        default:
          if (HyLaGIControllerState.running) {
            showToast('Error message: ' + response.message, 3000, 'red darken-4');
            selectLogTab();
            console.error(response);
          } else {
            showToast('Killed HyLaGI', 1000, '');
          }
          break;
      }
      const output = document.getElementById('output-initial')!;
      output.innerHTML = '';
      for (const elem of HyLaGIControllerState.dynamic_script_elements) {
        elem.parentNode!.removeChild(elem);
      }
      HyLaGIControllerState.dynamic_script_elements = [];
      if (html_mode_check_box.checked) {
        if (response.stdout != undefined) {
          output.innerHTML += response.stdout;
        }
        if (response.stderr != undefined) {
          output.innerHTML += response.stderr;
        }
        const scriptNodes = output.getElementsByTagName('script');
        for (let si = 0; si < scriptNodes.length; si++) {
          if (scriptNodes[si].hasAttribute('src')) {
            continue;
          }
          const newScript = document.createElement('script');
          newScript.innerHTML = scriptNodes[si].innerHTML;
          HyLaGIControllerState.dynamic_script_elements.push(
            first_script_element.parentNode!.insertBefore(newScript, first_script_element)
          );
        }
      } else {
        const getEscapedStringForHTML = (orig_string: string) =>
          orig_string.replace(/\n/gm, '<br/>').replace(/\s/gm, '&nbsp;');
        if (response.stdout != undefined) {
          output.innerHTML += getEscapedStringForHTML(response.stdout);
        }
        if (response.stderr != undefined) {
          output.innerHTML += getEscapedStringForHTML(response.stderr);
        }
      }
      stopPreloader();
      HyLaGIControllerState.running = false;
      updateHyLaGIExecIcon();
    };
    xmlhr.send(form);
  };
}

export function killHyLaGI() {
  /* build form data */
  const xmlhr = new XMLHttpRequest();
  xmlhr.open('GET', 'killer');
  xmlhr.send(null);
  HyLaGIControllerState.running = false;
  updateHyLaGIExecIcon();
}
