export class Triplet<T> {
  x: T;
  y: T;
  z: T;
  constructor(x: T, y: T, z: T) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  map<U>(f: (t: T) => U) {
    return new Triplet<U>(f(this.x), f(this.y), f(this.z));
  }
}

export class ComparableTriplet<T extends { equals(t: T): boolean }> extends Triplet<T> {
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

  static fromHue(h: number) {
    // assume S = V = 1
    const rgb = new RGB(1, 1, 1);
    h /= 60;
    const i = Math.floor(h);
    const f = h - i;
    switch (i) {
      default:
      case 0:
        rgb.g *= f;
        rgb.b *= 0;
        break;
      case 1:
        rgb.r *= 1 - f;
        rgb.b *= 0;
        break;
      case 2:
        rgb.r *= 0;
        rgb.b *= f;
        break;
      case 3:
        rgb.r *= 0;
        rgb.g *= 1 - f;
        break;
      case 4:
        rgb.r *= f;
        rgb.g *= 0;
        break;
      case 5:
        rgb.g *= 0;
        rgb.b *= 1 - f;
        break;
    }
    rgb.r = Math.floor(255 * rgb.r);
    rgb.g = Math.floor(255 * rgb.g);
    rgb.b = Math.floor(255 * rgb.b);
    return rgb;
  }

  asHex24() {
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
    return new Range(Number.MAXVALUE, Number.MINVALUE);
  }
}
