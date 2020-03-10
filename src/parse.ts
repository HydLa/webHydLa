abstract class Construct {
  abstract toString(): string;
  abstract getValue(env: { [key: string]: Construct }): number;

  static parse(value_str:string) {
    const isAlpha = (c: string) => /^[A-Za-z]$/.test(c);
    const isDigit = (c:string) => /^[0-9]$/.test(c);
    const isAlDig = (c:string) => isAlpha(c) || isDigit(c);
  
    /*
     * <expression> ::= <term> { +<term> | -<term> }
     * <term> ::= <term2> { *<term2> | /<term2> }
     * <term2> ::= <factor> { ^<factor> }
     * <factor> ::= (<expression>) | Func[<expression>] | <negative>
     * <negative> ::= { - } <leaf>
     * <leaf> ::= "Infinity" | parameter | constant | variable | number
     */
  
    const number = (s:string, i:number[]) => {
      let n = 0;
      while (isDigit(s[i[0]])) {
        n = n * 10 + parseInt(s[i[0]], 10);
        i[0]++;
      }
      return new Constant(n);
    };
  
    const parameter = (s:string, i:number[]) => {
      let p = "";
      while (s[i[0]] != "]") {
        p += s[i[0]];
        i[0]++;
      }
      p += s[i[0]]; // p[x,0,1]
      i[0]++;
      p = p.replace(/,/g, ", "); // p[x, 0, 1]
      return new Variable(p);
    }
  
    const variable = (s:string, i:number[]) => {
      var v = s[i[0]];
      i[0]++;
      while (isAlDig(s[i[0]]) || s[i[0]] == "'") {
        v += s[i[0]];
        i[0]++;
      }
      return new Variable(v);
    }
  
    const leaf = (s:string, i:number[]) => {
      let ret:Construct;
      // console.log("leaf", i);
      if (s.substring(i[0], i[0] + 8) == "Infinity") {
        i[0] += 8;
        ret = new Constant(Infinity);
      } else if (s.substring(i[0], i[0] + 2) == "p[") {
        ret = parameter(s, i);
      } else if (s.substring(i[0], i[0] + 2) == "Pi") {
        i[0] += 2;
        ret = new Constant(Math.PI);
      } else if (s[i[0]] == "E") {
        i[0]++;
        ret = new Constant(Math.E);
      } else if (s[i[0]] == "t" && !isAlDig(s[i[0] + 1])) {
        i[0]++;
        ret = new Variable("t");
      } else if (isAlpha(s[i[0]])) {
        ret = variable(s, i);
      } else {
        ret = number(s, i);
      }
      return ret;
    }
  
    const negative = (s:string, i:number[]) => {
      let ret:Construct;
      // console.log("negative", i);
      if (s[i[0]] == "-") {
        i[0]++; // "-"
        ret = new Negative(leaf(s, i)); // leafと入れ替えると結果が変わる
      } else {
        ret = leaf(s, i);
      }
      return ret;
    }
  
    const factor = (s:string, i:number[]) => {
      let ret:Construct;
      // console.log("factor", i);
      if (s[i[0]] == "(") {
        i[0]++; // "("
        ret = expression(s, i);
        i[0]++; // ")"
      } else if (s.substring(i[0], i[0] + 4) == "Log[") {
        i[0] += 4;
        ret = new Log(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 4) == "Sin[") {
        i[0] += 4;
        ret = new Sin(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 4) == "Cos[") {
        i[0] += 4;
        ret = new Cos(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 4) == "Tan[") {
        i[0] += 4;
        ret = new Tan(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 7) == "ArcSin[") {
        i[0] += 7;
        ret = new ArcSin(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 7) == "ArcCos[") {
        i[0] += 7;
        ret = new ArcCos(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 7) == "ArcTan[") {
        i[0] += 7;
        ret = new ArcTan(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 5) == "Sinh[") {
        i[0] += 5;
        ret = new Sinh(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 5) == "Cosh[") {
        i[0] += 5;
        ret = new Cosh(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 5) == "Tanh[") {
        i[0] += 5;
        ret = new Tanh(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 8) == "ArcSinh[") {
        i[0] += 8;
        ret = new ArcSinh(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 8) == "ArcCosh[") {
        i[0] += 8;
        ret = new ArcCosh(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 8) == "ArcTanh[") {
        i[0] += 8;
        ret = new ArcTanh(expression(s, i));
        i[0]++;
      } else if (s.substring(i[0], i[0] + 6) == "Floor[") {
        i[0] += 6;
        ret = new Floor(expression(s, i));
        i[0]++;
      } else {
        ret = negative(s, i);
      }
      return ret;
    }
  
    const term2 = (s:string, i:number[]) => {
      // console.log("term", i);
      let lhs = factor(s, i);
      while (true) {
        if (s[i[0]] == "^") {
          i[0]++;
          let rhs = factor(s, i);
          lhs = new Power(lhs, rhs);
        } else {
          break;
        }
      }
      return lhs;
    }
  
    var term = (s:string, i:number[]) => {
      // console.log("term", i);
      var lhs = term2(s, i);
      while (true) {
        if (s[i[0]] == "*") {
          i[0]++;
          let rhs = term2(s, i);
          lhs = new Multiply(lhs, rhs);
        } else if (s[i[0]] == "\/") {
          i[0]++;
          let rhs = term2(s, i);
          lhs = new Divide(lhs, rhs);
        } else {
          break;
        }
      }
      return lhs;
    };
  
    const expression = (s:string, i:number[]) => {
      // console.log("expression", i);
      var lhs = term(s, i);
      while (true) {
        if (s[i[0]] == "+") {
          i[0]++;
          let rhs = term(s, i);
          lhs = new Plus(lhs, rhs);
        } else if (s[i[0]] == "-") {
          i[0]++;
          let rhs = term(s, i);
          lhs = new Subtract(lhs, rhs);
        } else {
          break;
        }
      }
      return lhs;
    }
  
    var s = value_str.replace(/\s+/g, "");
    return expression(s, [0]);
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
