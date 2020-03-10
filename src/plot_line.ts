import { dat_gui_variable_folder, fixLayoutOfDatGUI } from "./main";

export class PlotLine {
  index: number;
  name: string;
  folder: dat.GUI;
  settings: {
    x: string;
    y: string;
    z: string;
    remove: () => void;
    dashed: boolean;
  };
  x_item: dat.GUIController;
  y_item: dat.GUIController;
  z_item: dat.GUIController;
  remain: boolean;
  color_angle: number;
  last_edited_input: HTMLInputElement;
  plotting: boolean;
  plot_ready: number;

  constructor(x_name: string, y_name: string, z_name: string, index: number) {
    this.index = index;
    this.name = "plot" + this.index;
    this.folder = dat_gui_variable_folder.addFolder(this.name);
    this.settings = { x: x_name, y: y_name, z: z_name, remove: () => { removeLine(this) }, dashed: false };
    this.x_item = this.folder.add(this.settings, "x");
    this.x_item.onChange(this.getUpdateFunction(this.x_item));
    this.y_item = this.folder.add(this.settings, "y");
    this.y_item.onChange(this.getUpdateFunction(this.y_item));
    this.z_item = this.folder.add(this.settings, "z");
    this.folder.add(this.settings, "remove");
    this.folder.add(this.settings, "dashed").onChange(function () { replot(this) });
    this.z_item.onChange(this.getUpdateFunction(this.z_item));
  }

  getUpdateFunction(item: dat.GUIController) {
    let prev: string;
    return (value) => {
      this.last_edited_input = <HTMLInputElement>item.domElement.firstChild;
      let val = (<HTMLInputElement>item.domElement.firstChild).value;
      if (prev === undefined || val != prev) {
        try {
          Construct.parse(val);
          replot_all();
        }
        catch (e) {
          this.updateFolder(false);
        }
      }
      prev = val;
    }
  }

  updateFolder(succeeded: boolean) {
    if (succeeded) {
      var color_on_correct = "#303030";
      (<HTMLInputElement>this.x_item.domElement.firstChild).style.backgroundColor =
        (<HTMLInputElement>this.y_item.domElement.firstChild).style.backgroundColor =
        (<HTMLInputElement>this.z_item.domElement.firstChild).style.backgroundColor = color_on_correct;
    }
    else {
      var elm = this.last_edited_input;
      if (elm === undefined) return;
      elm.style.backgroundColor = "#A00000";
    }
  }
  removeFolder() {
    this.folder.close();
    dat_gui_variable_folder.removeFolder(this.folder);
  }
}

export class PlotLineMap {
  map: { [key: number]: PlotLine } = {};
  plotLineIndex = 0;
  reset() {
    this.map = {};
    this.plotLineIndex = 0;
  }
  getLength() {
    return Object.keys(this.map).length;
  }
  removeLine(line: PlotLine) {
    if (this.getLength() <= 1) {
      return;
    }
    dat_gui_variable_folder.removeFolder(line.folder);
    remove_plot(line);
    delete settingsForCurrentHydat.plot_line_settings[line.index];
    browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
    delete this.map[line.index];
  }
  addNewLine(x_name: string, y_name: string, z_name: string) {
    while (this.map[this.plotLineIndex]) { ++this.plotLineIndex; }
    const line = this.addNewLineWithIndex(x_name, y_name, z_name, this.plotLineIndex);
    ++this.plotLineIndex;
    return line;
  }
  addNewLineWithIndex(x_name: string, y_name: string, z_name: string, index: number) {
    const line = new PlotLine(x_name, y_name, z_name, index);
    fixLayoutOfDatGUI();
    this.map[index] = line;
    return line;
  }
  // addNewLineWithIndexGuard(x_name: string, y_name: string, z_name: string, index: number) {
  //   // if(new_guard!=undefined){
  //   //   new_guard.index = 1 + index;
  //   //   delete this.map[new_guard.index];
  //   // }
  //   let new_guard = new PlotLine(x_name, y_name, z_name, index + 1);
  //   new_guard.remain = true;
  //   this.map[new_guard.index] = new_guard;
  //   //return new_line;
  // }
  removeAllFolders() {
    for (let i in this.map) {
      this.map[i].removeFolder();
    }
  }

  isAllReady() {
    for (let i in this.map) {
      if (this.map[i].plotting || this.map[i].plot_ready !== undefined) {
        return false;
      }
    }
    return true;
  }
}

export let plot_lines = new PlotLineMap();
