class Plus {
  constructor(lhs, rhs) {
    this.toString = function () { return "(" + lhs.toString() + " + " + rhs.toString() + ")"; };
    this.getValue = function (env) {
      return lhs.getValue(env) + rhs.getValue(env);
    };
  }
}

class Subtract {
  constructor(lhs, rhs) {
    this.toString = function () { return "(" + lhs.toString() + " - " + rhs.toString() + ")"; };
    this.getValue = function (env) {
      return lhs.getValue(env) - rhs.getValue(env);
    };
  }
}

class Multiply {
  constructor(lhs, rhs) {
    this.toString = function () { return lhs.toString() + " * " + rhs.toString(); };
    this.getValue = function (env) {
      return lhs.getValue(env) * rhs.getValue(env);
    };
  }
}

class Divide {
  constructor(lhs, rhs) {
    this.toString = function () { return lhs.toString() + " / " + rhs.toString(); };
    this.getValue = function (env) {
      return lhs.getValue(env) / rhs.getValue(env);
    };
  }
}

class Power {
  constructor(lhs, rhs) {
    this.toString = function () { return lhs.toString() + " ^ " + rhs.toString(); };
    this.getValue = function (env) {
      return Math.pow(lhs.getValue(env), rhs.getValue(env));
    };
  }
}

class Constant {
  constructor(val) {
    this.toString = function () { return val; };
    this.getValue = function (env) {
      return val;
    };
  }
}

class Variable {
  constructor(name) {
    this.toString = function () { return name; };
    this.getValue = function (env) {
      if (env[name] == undefined)
        throw new Error(name + " is not defined");
      return env[name].getValue(env);
    };
  }
}

class Log {
  constructor(arg) {
    this.toString = function () { return "log(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.log(arg.getValue(env));
    };
  }
}

class Sin {
  constructor(arg) {
    this.toString = function () { return "sin(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.sin(arg.getValue(env));
    };
  }
}

class Cos {
  constructor(arg) {
    this.toString = function () { return "cos(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.cos(arg.getValue(env));
    };
  }
}

class Tan {
  constructor(arg) {
    this.toString = function () { return "tan(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.tan(arg.getValue(env));
    };
  }
}

class ArcSin {
  constructor(arg) {
    this.toString = function () { return "asin(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.asin(arg.getValue(env));
    };
  }
}

class ArcCos {
  constructor(arg) {
    this.toString = function () { return "acos(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.acos(arg.getValue(env));
    };
  }
}

class ArcTan {
  constructor(arg) {
    this.toString = function () { return "atan(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.atan(arg.getValue(env));
    };
  }
}

class Sinh {
  constructor(arg) {
    this.toString = function () { return "sinh(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.sinh(arg.getValue(env));
    };
  }
}

class Cosh {
  constructor(arg) {
    this.toString = function () { return "cosh(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.cosh(arg.getValue(env));
    };
  }
}

class Tanh {
  constructor(arg) {
    this.toString = function () { return "tanh(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.tanh(arg.getValue(env));
    };
  }
}

class ArcSinh {
  constructor(arg) {
    this.toString = function () { return "asinh(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.asinh(arg.getValue(env));
    };
  }
}

class ArcCosh {
  constructor(arg) {
    this.toString = function () { return "acosh(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.acosh(arg.getValue(env));
    };
  }
}

class ArcTanh {
  constructor(arg) {
    this.toString = function () { return "atanh(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.atanh(arg.getValue(env));
    };
  }
}

class Floor {
  constructor(arg) {
    this.toString = function () { return "floor(" + arg + ")"; };
    this.getValue = function (env) {
      return Math.floor(arg.getValue(env));
    };
  }
}

class Negative {
  constructor(arg) {
    this.toString = function () { return "-" + arg; };
    this.getValue = function (env) {
      return -arg.getValue(env);
    };
  }
}

function parseValue(value_str) {
  var isalpha = function (c) { return ("A" <= c && c <= "Z") || ("a" <= c && c <= "z"); };
  var isdigit = function (c) { return "0" <= c && c <= "9"; };
  var isalnum = function (c) { return isalpha(c) || isdigit(c); };

  /*
   * <expression> ::= <term> { +<term> | -<term> }
   * <term> ::= <term2> { *<term2> | /<term2> }
   * <term2> ::= <factor> { ^<factor> }
   * <factor> ::= (<expression>) | Func[<expression>] | <negative>
   * <negative> ::= { - } <leaf>
   * <leaf> ::= "Infinity" | parameter | constant | variable | number
   */

  var number = function (s, i) {
    var n = 0;
    while (isdigit(s[i[0]])) {
      n = n * 10 + (s[i[0]] - "0")
      i[0]++;
    }
    return new Constant(n);
  };

  var parameter = function (s, i) {
    var p = "";
    while (s[i[0]] != "]") {
      p += s[i[0]];
      i[0]++;
    }
    p += s[i[0]]; // p[x,0,1]
    i[0]++;
    p = p.replace(/,/g, ", "); // p[x, 0, 1]
    return new Variable(p);
  }

  var variable = function (s, i) {
    var v = s[i[0]];
    i[0]++;
    while (isalnum(s[i[0]]) || s[i[0]] == "'") {
      v += s[i[0]];
      i[0]++;
    }
    return new Variable(v);
  }

  var leaf = function (s, i) {
    var ret;
    // console.log("leaf", i);
    if (s.substring(i[0], i[0] + 8) == "Infinity") {
      i[0] += 8;
      ret = "Infinity";
    } else if (s.substring(i[0], i[0] + 2) == "p[") {
      ret = parameter(s, i);
    } else if (s.substring(i[0], i[0] + 2) == "Pi") {
      i[0] += 2;
      ret = new Constant(Math.PI);
    } else if (s[i[0]] == "E") {
      i[0]++;
      ret = new Constant(Math.E);
    } else if (s[i[0]] == "t" && !isalnum(s[i[0] + 1])) {
      i[0]++;
      ret = new Variable("t");
    } else if (isalpha(s[i[0]])) {
      ret = variable(s, i);
    } else {
      ret = number(s, i);
    }
    return ret;
  }

  var negative = function (s, i) {
    var ret;
    // console.log("negative", i);
    if (s[i[0]] == "-") {
      i[0]++; // "-"
      ret = new Negative(leaf(s, i)); // leafと入れ替えると結果が変わる
    } else {
      ret = leaf(s, i);
    }
    return ret;
  }

  var factor = function (s, i) {
    var ret;
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

  var term2 = function (s, i) {
    // console.log("term", i);
    var lhs = factor(s, i);
    while (true) {
      if (s[i[0]] == "^") {
        i[0]++;
        var rhs = factor(s, i);
        lhs = new Power(lhs, rhs);
      } else {
        break;
      }
    }
    return lhs;
  }

  var term = function (s, i) {
    // console.log("term", i);
    var lhs = term2(s, i);
    var rhs;
    while (true) {
      if (s[i[0]] == "*") {
        i[0]++;
        rhs = term2(s, i);
        lhs = new Multiply(lhs, rhs);
      } else if (s[i[0]] == "\/") {
        i[0]++;
        rhs = term2(s, i);
        lhs = new Divide(lhs, rhs);
      } else {
        break;
      }
    }
    return lhs;
  };

  var expression = function (s, i) {
    // console.log("expression", i);
    var lhs = term(s, i);
    var rhs;
    while (true) {
      if (s[i[0]] == "+") {
        i[0]++;
        rhs = term(s, i);
        lhs = new Plus(lhs, rhs);
      } else if (s[i[0]] == "-") {
        i[0]++;
        rhs = term(s, i);
        lhs = new Subtract(lhs, rhs);
      } else {
        break;
      }
    }
    return lhs;
  }

  var s = value_str.replace(/\s+/g, "");
  return expression(s, [0]);
};

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
