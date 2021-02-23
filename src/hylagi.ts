import { startPreloader, stopPreloader, showToast, selectLogTab } from './dom_control';
import { getEditedCode } from './editor_control';
import { HydatControl } from './hydat_control';
import { StorageControl } from './storage_control';

const first_script_element = document.getElementsByTagName('script')[0];
const html_mode_check_box = <HTMLInputElement>document.getElementById('html_mode_check_box');

export class HyLaGIController {
  static running = false;
  static dynamic_script_elements: HTMLElement[];
  static init() {
    this.dynamic_script_elements = [];
  }
  static exec() {
    if (this.running) {
      this.killHyLaGI();
    } else {
      HyLaGIController.sendHydLa(getEditedCode());
    }
  }
  static updateExecIcon() {
    const run_button = <HTMLInputElement>document.getElementById('run_button');
    if (this.running) {
      run_button.value = 'KILL'; // for new UI
      const elist = document.getElementsByClassName('exec-icon');
      for (let i = 0; i < elist.length; ++i) {
        elist[i].classList.remove('mdi-content-send');
        elist[i].classList.add('mdi-content-clear');
      }
    } else {
      run_button.value = 'RUN'; // for new UI
      const elist = document.getElementsByClassName('exec-icon');
      for (let i = 0; i < elist.length; ++i) {
        elist[i].classList.add('mdi-content-send');
        elist[i].classList.remove('mdi-content-clear');
      }
    }
  }
  /* function to submit hydla code to server */
  static sendHydLa(hydla: string) {
    startPreloader();
    this.running = true;
    this.updateExecIcon();

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
      if (phase_num.value != '') options_value += ' -p ' + phase_num.value;
      if (simulation_time.value != '') options_value += ' -t ' + simulation_time.value;
      if (phase_num.value == '' && simulation_time.value == '') options_value += ' -p10';
      if (html_mode_check_box.checked) options_value += ' -d --fhtml ';
      if (nd_mode_check_box.checked) options_value += ' --fnd ';
      else options_value += ' --fno-nd ';
      if (other_options.value != '') options_value += other_options.value;
      form.append('hylagi_option', options_value);
      let timeout_value = '';
      if (timeout_option.value != '') timeout_value = timeout_option.value;
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
              HydatControl.loadHydat(response.hydat);
            } else {
              selectLogTab();
            }
            break;
          default:
            if (this.running) {
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
        for (const elem of this.dynamic_script_elements) {
          elem.parentNode!.removeChild(elem);
        }
        this.dynamic_script_elements = [];
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
            this.dynamic_script_elements.push(
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
        this.running = false;
        this.updateExecIcon();
      };
      xmlhr.send(form);
    };
  }
  static killHyLaGI() {
    /* build form data */
    const xmlhr = new XMLHttpRequest();
    xmlhr.open('GET', 'killer');
    xmlhr.send(null);
    this.running = false;
    this.updateExecIcon();
  }
}
