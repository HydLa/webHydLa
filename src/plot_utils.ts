export class Triplet<T>{
  x: T;
  y: T;
  z: T;
  constructor(x: T, y: T, z: T) {
    this.x = x;
    this.y = y;
    this.z = z;
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
