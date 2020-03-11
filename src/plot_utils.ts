export class Triplet<T>{
  x: T;
  y: T;
  z: T;
  constructor(x: T, y: T, z: T) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  map<U>(f: (t:T) => U) {
    return new Triplet<U>(f(this.x), f(this.y), f(this.z));
  }
}

export class ComparableTriplet<T extends { equals(t: T): boolean; }> extends Triplet<T>{
  equals(t: ComparableTriplet<T>) {
    return this.x.equals(t.x) && this.y.equals(t.y) && this.z.equals(t.z);
  }
}

export class RGB {
  r: number;
  g: number;
  b: number;

  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  equals(rgb: RGB) {
    return this.r === rgb.r && this.g === rgb.g && this.b === rgb.b;
  }

  static fromHue(h:number) {
    // assume S = V = 1
    let rgb = new RGB(1,1,1);
    h /= 60;
    var i = Math.floor(h);
    var f = h - i;
    switch (i) {
      default:
      case 0: rgb.g *= f; rgb.b *= 0; break;
      case 1: rgb.r *= 1 - f; rgb.b *= 0; break;
      case 2: rgb.r *= 0; rgb.b *= f; break;
      case 3: rgb.r *= 0; rgb.g *= 1 - f; break;
      case 4: rgb.r *= f; rgb.g *= 0; break;
      case 5: rgb.g *= 0; rgb.b *= 1 - f; break;
    }
    rgb.r = Math.floor(255 * rgb.r);
    rgb.g = Math.floor(255 * rgb.g);
    rgb.b = Math.floor(255 * rgb.b);
    return rgb;
  }

  asHex24(){
    return (this.r << 16) + (this.g << 8) + this.b;
  }
}

export class Range {
  min: number;
  max: number;
  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  getInterval() {
    return this.max - this.min;
  }

  equals(r: Range) {
    return this.min === r.min && this.max === r.max;
  }

  static getEmpty() {
    return new Range(Number.MAX_VALUE, Number.MIN_VALUE);
  }
}

// function replot(line) {
//   remove_plot(line);
//   remove_mesh(plot_animate);
//   add_plot(line);
//   if (line.settings.x != "" && line.settings.y != "" && line.settings.z != "") {
//     if (line.remain == undefined) {
//       settingsForCurrentHydat.plot_line_settings[line.index] = line.settings;
//       browser_storage.setItem(current_hydat.name, JSON.stringify(settingsForCurrentHydat));
//     }
//   }
// }


// function vector3_to_geometry(vector3_list:THREE.Vector3[]) {
//   let geometry = new THREE.Geometry();
//   for (let vec of vector3_list) {
//     geometry.vertices.push(vec);
//   }
//   return geometry;
// }

// function toUnitVector(vector:THREE.Vector3) {
//   let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
//   return new THREE.Vector3(vector.x / length, vector.y / length, vector.z / length);
// }

// function guard() {
//   const g_geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
//   const g_material = new THREE.MeshBasicMaterial({
//     color: 0x0000ff
//     , wireframe: true
//   });
//   let guard = new THREE.Mesh(g_geometry, g_material);
//   guard.position.set(0, 0, 0);
//   //guard.rotation.set(0, Math.PI/2, Math.PI/2);//y
//   guard.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
//   GraphControl.scene.add(guard);
// }
