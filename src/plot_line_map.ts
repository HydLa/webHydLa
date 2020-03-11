import { PlotLine } from "./plot_line";

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

  replotAll() {
    // var table = document.getElementById("graph_axis_table");
    for (let i in this.map) {
      this.map[i].color_angle = parseInt(i) / this.getLength() * 360;
      this.map[i].replot();
    }
    graph.time = 0;
  }
}
