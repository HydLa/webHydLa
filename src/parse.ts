export function isAlpha(c: string) {
  const regex = new RegExp('^[A-Za-z]$');
  return regex.test(c);
}

export function isDigit(c: string) {
  const regex = new RegExp('^[0-9]$');
  return regex.test(c);
}

export function isAlDig(c: string) {
  return isAlpha(c) || isDigit(c);
}

/*
 * <expression> ::= <term> { +<term> | -<term> }
 * <term> ::= <term2> { *<term2> | /<term2> }
 * <term2> ::= <factor> { ^<factor> }
 * <factor> ::= (<expression>) | Func[<expression>] | <negative>
 * <negative> ::= { - } <leaf>
 * <leaf> ::= "Infinity" | parameter | constant | variable | number
 */

export function number(s: string, index: number): [Constant, number] {
  let n = 0;
  while (isDigit(s[index])) {
    n = n * 10 + parseInt(s[index], 10);
    index++;
  }
  return [new Constant(n), index];
}

export function parameter(s: string, index: number): [Variable, number] {
  let p = '';
  while (s[index] != ']') {
    p += s[index];
    index++;
  }
  p += s[index]; // p[x,0,1]
  index++;
  p = p.replace(/,/g, ', '); // p[x, 0, 1]
  return [new Variable(p), index];
}

export function variable(s: string, index: number): [Variable, number] {
  let v = s[index];
  index++;
  while (isAlDig(s[index]) || s[index] == "'") {
    v += s[index];
    index++;
  }
  return [new Variable(v), index];
}

export function leaf(s: string, index: number): [Construct, number] {
  let ret: Construct;
  if (s.substring(index, index + 8) == 'Infinity') {
    index += 8;
    ret = new Constant(Infinity);
  } else if (s.substring(index, index + 2) == 'p[') {
    [ret, index] = parameter(s, index);
  } else if (s.substring(index, index + 2) == 'Pi') {
    index += 2;
    ret = new Constant(Math.PI);
  } else if (s[index] == 'E') {
    index++;
    ret = new Constant(Math.E);
  } else if (s[index] == 't' && !isAlDig(s[index + 1])) {
    index++;
    ret = new Variable('t');
  } else if (isAlpha(s[index])) {
    [ret, index] = variable(s, index);
  } else {
    [ret, index] = number(s, index);
  }
  return [ret, index];
}

export function negative(s: string, index: number): [Construct, number] {
  let ret: Construct;
  if (s[index] == '-') {
    index++; // "-"
    [ret, index] = leaf(s, index);
    ret = new Negative(ret);
  } else {
    [ret, index] = leaf(s, index);
  }
  return [ret, index];
}

export function factor(s: string, index: number): [Construct, number] {
  let ret: Construct;
  let tmp: Construct;
  if (s[index] == '(') {
    index++; // "("
    [ret, index] = expression(s, index);
    index++; // ")"
  } else if (s.substring(index, index + 4) == 'Log[') {
    index += 4;
    [tmp, index] = expression(s, index);
    ret = new Log(tmp);
    index++;
  } else if (s.substring(index, index + 4) == 'Sin[') {
    index += 4;
    [tmp, index] = expression(s, index);
    ret = new Sin(tmp);
    index++;
  } else if (s.substring(index, index + 4) == 'Cos[') {
    index += 4;
    [tmp, index] = expression(s, index);
    ret = new Cos(tmp);
    index++;
  } else if (s.substring(index, index + 4) == 'Tan[') {
    index += 4;
    [tmp, index] = expression(s, index);
    ret = new Tan(tmp);
    index++;
  } else if (s.substring(index, index + 7) == 'ArcSin[') {
    index += 7;
    [tmp, index] = expression(s, index);
    ret = new ArcSin(tmp);
    index++;
  } else if (s.substring(index, index + 7) == 'ArcCos[') {
    index += 7;
    [tmp, index] = expression(s, index);
    ret = new ArcCos(tmp);
    index++;
  } else if (s.substring(index, index + 7) == 'ArcTan[') {
    index += 7;
    [tmp, index] = expression(s, index);
    ret = new ArcTan(tmp);
    index++;
  } else if (s.substring(index, index + 5) == 'Sinh[') {
    index += 5;
    [tmp, index] = expression(s, index);
    ret = new Sinh(tmp);
    index++;
  } else if (s.substring(index, index + 5) == 'Cosh[') {
    index += 5;
    [tmp, index] = expression(s, index);
    ret = new Cosh(tmp);
    index++;
  } else if (s.substring(index, index + 5) == 'Tanh[') {
    index += 5;
    [tmp, index] = expression(s, index);
    ret = new Tanh(tmp);
    index++;
  } else if (s.substring(index, index + 8) == 'ArcSinh[') {
    index += 8;
    [tmp, index] = expression(s, index);
    ret = new ArcSinh(tmp);
    index++;
  } else if (s.substring(index, index + 8) == 'ArcCosh[') {
    index += 8;
    [tmp, index] = expression(s, index);
    ret = new ArcCosh(tmp);
    index++;
  } else if (s.substring(index, index + 8) == 'ArcTanh[') {
    index += 8;
    [tmp, index] = expression(s, index);
    ret = new ArcTanh(tmp);
    index++;
  } else if (s.substring(index, index + 6) == 'Floor[') {
    index += 6;
    [tmp, index] = expression(s, index);
    ret = new Floor(tmp);
    index++;
  } else {
    [ret, index] = negative(s, index);
  }
  return [ret, index];
}

export function term2(s: string, index: number): [Construct, number] {
  let lhs: Construct;
  [lhs, index] = factor(s, index);
  for (;;) {
    if (s[index] == '^') {
      index++;
      let rhs: Construct;
      [rhs, index] = factor(s, index);
      lhs = new Power(lhs, rhs);
    } else {
      break;
    }
  }
  return [lhs, index];
}

export function term(s: string, index: number): [Construct, number] {
  let lhs: Construct;
  [lhs, index] = term2(s, index);
  for (;;) {
    let rhs: Construct;
    if (s[index] == '*') {
      index++;
      [rhs, index] = term2(s, index);
      lhs = new Multiply(lhs, rhs);
    } else if (s[index] == '/') {
      index++;
      [rhs, index] = term2(s, index);
      lhs = new Divide(lhs, rhs);
    } else {
      break;
    }
  }
  return [lhs, index];
}

export function expression(s: string, index: number): [Construct, number] {
  let lhs: Construct;
  [lhs, index] = term(s, index);
  for (;;) {
    let rhs: Construct;
    if (s[index] == '+') {
      index++;
      [rhs, index] = term(s, index);
      lhs = new Plus(lhs, rhs);
    } else if (s[index] == '-') {
      index++;
      [rhs, index] = term(s, index);
      lhs = new Subtract(lhs, rhs);
    } else {
      break;
    }
  }
  return [lhs, index];
}

export function parse(value_str: string) {
  const s = value_str.replace(/\s+/g, '');
  return expression(s, 0)[0];
}

export interface Construct {
  toString(): string;
  getValue(env: { [key: string]: Construct }): number;
}

interface UnaryConstruct extends Construct {
  arg: Construct;
}

interface BinaryConstruct extends Construct {
  lhs: Construct;
  rhs: Construct;
}

export class Plus implements BinaryConstruct {
  constructor(public lhs: Construct, public rhs: Construct) {}
  toString() {
    return `(${this.lhs.toString()} + ${this.rhs.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) + this.rhs.getValue(env);
  }
}

class Subtract implements BinaryConstruct {
  constructor(public lhs: Construct, public rhs: Construct) {}
  toString() {
    return `(${this.lhs.toString()} - ${this.rhs.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) - this.rhs.getValue(env);
  }
}

class Multiply implements BinaryConstruct {
  constructor(public lhs: Construct, public rhs: Construct) {}
  toString() {
    return `${this.lhs.toString()} * ${this.rhs.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) * this.rhs.getValue(env);
  }
}

class Divide implements BinaryConstruct {
  constructor(public lhs: Construct, public rhs: Construct) {}
  toString() {
    return `${this.lhs.toString()} / ${this.rhs.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) / this.rhs.getValue(env);
  }
}

class Power implements BinaryConstruct {
  constructor(public lhs: Construct, public rhs: Construct) {}
  toString() {
    return `${this.lhs.toString()} ^ ${this.rhs.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.pow(this.lhs.getValue(env), this.rhs.getValue(env));
  }
}

export class Constant implements Construct {
  constructor(public val: number) {}
  toString() {
    return this.val.toString();
  }
  getValue(env: { [key: string]: Construct }) {
    return this.val;
  }
}

class Variable implements Construct {
  constructor(public name: string) {}
  toString() {
    return this.name;
  }
  getValue(env: { [key: string]: Construct }) {
    if (env[this.name] == undefined) throw new Error(this.name + ' is not defined');
    return env[this.name].getValue(env);
  }
}

class Log implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `log(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.log(this.arg.getValue(env));
  }
}

class Sin implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `sin(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.sin(this.arg.getValue(env));
  }
}

class Cos implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `cos(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.cos(this.arg.getValue(env));
  }
}

class Tan implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `tan(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.tan(this.arg.getValue(env));
  }
}

class ArcSin implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `asin(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.asin(this.arg.getValue(env));
  }
}

class ArcCos implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `acos(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.acos(this.arg.getValue(env));
  }
}

class ArcTan implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `atan(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.atan(this.arg.getValue(env));
  }
}

class Sinh implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `sinh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.sinh(this.arg.getValue(env));
  }
}

class Cosh implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `cosh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.cosh(this.arg.getValue(env));
  }
}

class Tanh implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `tanh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.tanh(this.arg.getValue(env));
  }
}

class ArcSinh implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `asinh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.asinh(this.arg.getValue(env));
  }
}

class ArcCosh implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `acosh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.acosh(this.arg.getValue(env));
  }
}

class ArcTanh implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `atanh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.atanh(this.arg.getValue(env));
  }
}

class Floor implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `floor(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.floor(this.arg.getValue(env));
  }
}

class Negative implements UnaryConstruct {
  constructor(public arg: Construct) {}
  toString() {
    return `-${this.arg.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return -this.arg.getValue(env);
  }
}
