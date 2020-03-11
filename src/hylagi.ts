import { DOMControl } from "./dom_control";
import { EditorControl } from "./editor_control";

const first_script_element = document.getElementsByTagName('script')[0];
const html_mode_check_box = <HTMLInputElement>document.getElementById("html_mode_check_box");

export class HyLaGIController {
  static running = false;
  static dynamic_script_elements: HTMLElement[];
  static init() {
    
  }
  static exec() {
    if (this.running) {
      this.killHyLaGI();
    }
    else {
      EditorControl.sendHydLa();
    }
  }
  static updateExecIcon() {
    let run_button = <HTMLInputElement>document.getElementById('run_button');
    if (this.running) {
      run_button.value = "KILL"; // for new UI
      var elist = document.getElementsByClassName("exec-icon");
      for (var i = 0; i < elist.length; ++i) {
        elist[i].classList.remove("mdi-content-send");
        elist[i].classList.add("mdi-content-clear");
      }
    }
    else {
      run_button.value = "RUN"; // for new UI
      var elist = document.getElementsByClassName("exec-icon");
      for (var i = 0; i < elist.length; ++i) {
        elist[i].classList.add("mdi-content-send");
        elist[i].classList.remove("mdi-content-clear");
      }
    }
  }
  /* function to submit hydla code to server */
  static sendHydLa(hydla:string) {
    DOMControl.startPreloader();
    this.running = true;
    this.updateExecIcon();

    var hr = new XMLHttpRequest();
    hr.open("GET", "start_session");
    hr.send(null);

    let that = this;
    hr.onload = (_) => {
      /* build form data */
      var form = new FormData();
      form.append("hydla_code", hydla);
      var options_value = "";
      let phase_num = <HTMLInputElement>document.getElementById("phase_num");
      let simulation_time = <HTMLInputElement>document.getElementById("simulation_time");
      let nd_mode_check_box = <HTMLInputElement>document.getElementById("nd_mode_check_box");
      let other_options = <HTMLInputElement>document.getElementById("other_options");
      let timeout_option = <HTMLInputElement>document.getElementById("timeout_option");
      if (phase_num.value != "") options_value += " -p " + phase_num.value;
      if (simulation_time.value != "") options_value += " -t " + simulation_time.value;
      if (phase_num.value == "" && simulation_time.value == "") options_value += " -p10";
      if (html_mode_check_box.checked) options_value += " -d --fhtml ";
      if (nd_mode_check_box.checked) options_value += " --fnd ";
      else options_value += " --fno-nd ";
      if (other_options.value != "") options_value += other_options.value;
      form.append("hylagi_option", options_value);
      var timeout_value = "";
      if (timeout_option.value != "") timeout_value = timeout_option.value;
      else timeout_value = "30";
      form.append("timeout_option", timeout_value);
      var xmlhr = new XMLHttpRequest();
      xmlhr.open("POST", "hydat.cgi");
      xmlhr.onload = (_) => {
        var response = JSON.parse(xmlhr.responseText);

        switch (response.error) {
          case 0:
            DOMControl.showToast("Simulation was successful.", 1000, "");
            if (response.hydat != undefined) {
              response.hydat.name = browser_storage.getItem("hydla_name");
              loadHydat(response.hydat);
            }
            else {
              $('ul.tabs').tabs('select', 'output-area');
            }
            break;
          default:
            if (that.running) {
              DOMControl.showToast(
                "Error message: " + response.message,
                3000,
                "red darken-4"
              );
              $('ul.tabs').tabs('select', 'output-area');
            }
            else {
              DOMControl.showToast("Killed HyLaGI", 1000, "");
            }
            break;
        }
        // let server_response = response;
        var output = document.getElementById("output-initial");
        output.innerHTML = "";
        for (let elem of that.dynamic_script_elements) {
          elem.parentNode.removeChild(elem);
        }
        that.dynamic_script_elements = [];
        if (html_mode_check_box.checked) {
          if (response.stdout != undefined) {
            output.innerHTML += response.stdout;
          }
          if (response.stderr != undefined) {
            output.innerHTML += response.stderr;
          }
          let scriptNodes = output.getElementsByTagName("script");
          for (var si = 0; si < scriptNodes.length; si++) {
            if (scriptNodes[si].hasAttribute("src")) {
              continue;
            }
            var newScript = document.createElement("script");
            newScript.innerHTML = scriptNodes[si].innerHTML;
            that.dynamic_script_elements.push(first_script_element.parentNode.insertBefore(newScript, first_script_element));
          }
        }
        else {
          const getEscapedStringForHTML = (orig_string)=>orig_string.replace(/\n/mg, "<br/>").replace(/\s/mg, "&nbsp;");
          if (response.stdout != undefined) {
            output.innerHTML += getEscapedStringForHTML(response.stdout);
          }
          if (response.stderr != undefined) {
            output.innerHTML += getEscapedStringForHTML(response.stderr);
          }
        }
        DOMControl.stopPreloader();
        that.running = false;
        that.updateExecIcon();
      };
      xmlhr.send(form);
    };
  }
  static killHyLaGI() {
    /* build form data */
    var xmlhr = new XMLHttpRequest();
    xmlhr.open("GET", "killer");
    xmlhr.send(null);
    this.running = false;
    this.updateExecIcon();
  }
}
