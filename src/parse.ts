abstract class Construct {
  abstract toString(): string;
  abstract getValue(env: { [key: string]: Construct }): number;

  static parse(value_str: string) {
    const isAlpha = (c: string) => /^[A-Za-z]$/.test(c);
    const isDigit = (c: string) => /^[0-9]$/.test(c);
    const isAlDig = (c: string) => isAlpha(c) || isDigit(c);

    let index = 0;

    /*
     * <expression> ::= <term> { +<term> | -<term> }
     * <term> ::= <term2> { *<term2> | /<term2> }
     * <term2> ::= <factor> { ^<factor> }
     * <factor> ::= (<expression>) | Func[<expression>] | <negative>
     * <negative> ::= { - } <leaf>
     * <leaf> ::= "Infinity" | parameter | constant | variable | number
     */

    const number = (s: string) => {
      let n = 0;
      while (isDigit(s[index])) {
        n = n * 10 + parseInt(s[index], 10);
        index++;
      }
      return new Constant(n);
    };

    const parameter = (s: string) => {
      let p = "";
      while (s[index] != "]") {
        p += s[index];
        index++;
      }
      p += s[index]; // p[x,0,1]
      index++;
      p = p.replace(/,/g, ", "); // p[x, 0, 1]
      return new Variable(p);
    }

    const variable = (s: string) => {
      var v = s[index];
      index++;
      while (isAlDig(s[index]) || s[index] == "'") {
        v += s[index];
        index++;
      }
      return new Variable(v);
    }

    const leaf = (s: string) => {
      let ret: Construct;
      // console.log("leaf", i);
      if (s.substring(index, index + 8) == "Infinity") {
        index += 8;
        ret = new Constant(Infinity);
      } else if (s.substring(index, index + 2) == "p[") {
        ret = parameter(s);
      } else if (s.substring(index, index + 2) == "Pi") {
        index += 2;
        ret = new Constant(Math.PI);
      } else if (s[index] == "E") {
        index++;
        ret = new Constant(Math.E);
      } else if (s[index] == "t" && !isAlDig(s[index + 1])) {
        index++;
        ret = new Variable("t");
      } else if (isAlpha(s[index])) {
        ret = variable(s);
      } else {
        ret = number(s);
      }
      return ret;
    }

    const negative = (s: string) => {
      let ret: Construct;
      // console.log("negative", i);
      if (s[index] == "-") {
        index++; // "-"
        ret = new Negative(leaf(s)); // leafと入れ替えると結果が変わる
      } else {
        ret = leaf(s);
      }
      return ret;
    }

    const factor = (s: string) => {
      let ret: Construct;
      // console.log("factor", i);
      if (s[index] == "(") {
        index++; // "("
        ret = expression(s);
        index++; // ")"
      } else if (s.substring(index, index + 4) == "Log[") {
        index += 4;
        ret = new Log(expression(s));
        index++;
      } else if (s.substring(index, index + 4) == "Sin[") {
        index += 4;
        ret = new Sin(expression(s));
        index++;
      } else if (s.substring(index, index + 4) == "Cos[") {
        index += 4;
        ret = new Cos(expression(s));
        index++;
      } else if (s.substring(index, index + 4) == "Tan[") {
        index += 4;
        ret = new Tan(expression(s));
        index++;
      } else if (s.substring(index, index + 7) == "ArcSin[") {
        index += 7;
        ret = new ArcSin(expression(s));
        index++;
      } else if (s.substring(index, index + 7) == "ArcCos[") {
        index += 7;
        ret = new ArcCos(expression(s));
        index++;
      } else if (s.substring(index, index + 7) == "ArcTan[") {
        index += 7;
        ret = new ArcTan(expression(s));
        index++;
      } else if (s.substring(index, index + 5) == "Sinh[") {
        index += 5;
        ret = new Sinh(expression(s));
        index++;
      } else if (s.substring(index, index + 5) == "Cosh[") {
        index += 5;
        ret = new Cosh(expression(s));
        index++;
      } else if (s.substring(index, index + 5) == "Tanh[") {
        index += 5;
        ret = new Tanh(expression(s));
        index++;
      } else if (s.substring(index, index + 8) == "ArcSinh[") {
        index += 8;
        ret = new ArcSinh(expression(s));
        index++;
      } else if (s.substring(index, index + 8) == "ArcCosh[") {
        index += 8;
        ret = new ArcCosh(expression(s));
        index++;
      } else if (s.substring(index, index + 8) == "ArcTanh[") {
        index += 8;
        ret = new ArcTanh(expression(s));
        index++;
      } else if (s.substring(index, index + 6) == "Floor[") {
        index += 6;
        ret = new Floor(expression(s));
        index++;
      } else {
        ret = negative(s);
      }
      return ret;
    }

    const term2 = (s: string) => {
      // console.log("term", i);
      let lhs = factor(s);
      while (true) {
        if (s[index] == "^") {
          index++;
          let rhs = factor(s);
          lhs = new Power(lhs, rhs);
        } else {
          break;
        }
      }
      return lhs;
    }

    var term = (s: string) => {
      // console.log("term", i);
      var lhs = term2(s);
      while (true) {
        if (s[index] == "*") {
          index++;
          let rhs = term2(s);
          lhs = new Multiply(lhs, rhs);
        } else if (s[index] == "\/") {
          index++;
          let rhs = term2(s);
          lhs = new Divide(lhs, rhs);
        } else {
          break;
        }
      }
      return lhs;
    };

    const expression = (s: string) => {
      // console.log("expression", i);
      var lhs = term(s);
      while (true) {
        if (s[index] == "+") {
          index++;
          let rhs = term(s);
          lhs = new Plus(lhs, rhs);
        } else if (s[index] == "-") {
          index++;
          let rhs = term(s);
          lhs = new Subtract(lhs, rhs);
        } else {
          break;
        }
      }
      return lhs;
    }

    var s = value_str.replace(/\s+/g, "");
    return expression(s);
  }
}

abstract class UnaryConstruct extends Construct {
  arg: Construct;
  constructor(arg: Construct) {
    super();
    this.arg = arg;
  }
}

abstract class BinaryConstruct extends Construct {
  lhs: Construct;
  rhs: Construct;
  constructor(lhs: Construct, rhs: Construct) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

class Plus extends BinaryConstruct {
  toString() {
    return `(${this.lhs.toString()} + ${this.rhs.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) + this.rhs.getValue(env);
  }
}

class Subtract extends BinaryConstruct {
  toString() {
    return `(${this.lhs.toString()} - ${this.rhs.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) - this.rhs.getValue(env);
  }
}

class Multiply extends BinaryConstruct {
  toString() {
    return `${this.lhs.toString()} * ${this.rhs.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) * this.rhs.getValue(env);
  };
}

class Divide extends BinaryConstruct {
  toString() {
    return `${this.lhs.toString()} / ${this.rhs.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return this.lhs.getValue(env) / this.rhs.getValue(env);
  }
}

class Power extends BinaryConstruct {
  toString() {
    return `${this.lhs.toString()} ^ ${this.rhs.toString()}`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.pow(this.lhs.getValue(env), this.rhs.getValue(env));
  }
}

class Constant extends Construct {
  val: number;
  constructor(val: number) {
    super();
    this.val = val;
  }
  toString() { return this.val.toString(); }
  getValue(env: { [key: string]: Construct }) {
    return this.val;
  }
}

class Variable extends Construct {
  name: string;
  constructor(name: string) {
    super();
    this.name = name;
  }
  toString() { return this.name; };
  getValue(env: { [key: string]: Construct }) {
    if (env[this.name] == undefined)
      throw new Error(this.name + " is not defined");
    return env[this.name].getValue(env);
  };
}

class Log extends UnaryConstruct {
  toString() {
    return `log(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.log(this.arg.getValue(env));
  }
}

class Sin extends UnaryConstruct {
  toString() {
    return `sin(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.sin(this.arg.getValue(env));
  }
}

class Cos extends UnaryConstruct {
  toString() {
    return `cos(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.cos(this.arg.getValue(env));
  }
}

class Tan extends UnaryConstruct {
  toString() {
    return `tan(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.tan(this.arg.getValue(env));
  }
}

class ArcSin extends UnaryConstruct {
  toString() {
    return `asin(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.asin(this.arg.getValue(env));
  }
}

class ArcCos extends UnaryConstruct {
  toString() {
    return `acos(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.acos(this.arg.getValue(env));
  }
}

class ArcTan extends UnaryConstruct {
  toString() {
    return `atan(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.atan(this.arg.getValue(env));
  }
}

class Sinh extends UnaryConstruct {
  toString() {
    return `sinh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.sinh(this.arg.getValue(env));
  }
}

class Cosh extends UnaryConstruct {
  toString() {
    return `cosh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.cosh(this.arg.getValue(env));
  }
}

class Tanh extends UnaryConstruct {
  toString() {
    return `tanh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.tanh(this.arg.getValue(env));
  }
}

class ArcSinh extends UnaryConstruct {
  toString() {
    return `asinh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.asinh(this.arg.getValue(env));
  }
}

class ArcCosh extends UnaryConstruct {
  toString() {
    return `acosh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.acosh(this.arg.getValue(env));
  }
}

class ArcTanh extends UnaryConstruct {
  toString() {
    return `atanh(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.atanh(this.arg.getValue(env));
  }
}

class Floor extends UnaryConstruct {
  toString() {
    return `floor(${this.arg.toString()})`;
  }
  getValue(env: { [key: string]: Construct }) {
    return Math.floor(this.arg.getValue(env));
  }
}

class Negative extends UnaryConstruct {
  toString() {
    return `-${this.arg.toString()}`;;
  }
  getValue(env: { [key: string]: Construct }) {
    return -this.arg.getValue(env);
  }
}


/*
console.log(parseValue("1+1").getValue() == 2);
console.log(parseValue("1*1").getValue() == 1);
console.log(parseValue("1-1").getValue() == 0);
console.log(parseValue("1\/1").getValue() == 1);
console.log(parseValue("1").getValue() == 1);
console.log(parseValue("(1+1)").getValue() == 2);
console.log(parseValue("(1*1)\/1").getValue() == 1);
console.log(parseValue("1^1").getValue() == 1);
console.log(parseValue("-1").getValue() == -1);
console.log(parseValue("-1+-1").getValue() == -2);
console.log(parseValue("Infinity"));
// console.log(parseValue("p[x,0,1]").getValue());
console.log(parseValue("Pi").getValue());
console.log(parseValue("E").getValue());
//console.log(parseValue("t").getValue());
//console.log(parseValue("timer").getValue());
//console.log(parseValue("x0").getValue());
console.log(parseValue("Log[10]").getValue());
console.log(parseValue("Sin[0]").getValue());
console.log(parseValue("Cos[0]").getValue());
console.log(parseValue("Tan[0]").getValue());
console.log(parseValue("Floor[E]").getValue());
console.log(parseValue("(t * (-1250) + 125 * p[v, 0, 1] + 613 * (20 * p[ht, 0, 1] + p[v, 0, 1] ^ 2) ^ (1\/2))*(t*(-250)+25*p[v, 0, 1]+97*(20*p[ht, 0, 1]+p[v, 0, 1]^2)^(1\/2))*(-1)\/62500"));
*/
