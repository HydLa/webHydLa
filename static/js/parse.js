
Plus = function(lhs, rhs)
{
  this.toString = function(){return "(" + lhs.toString() + " + " + rhs.toString() + ")";};
  this.getValue = function(env)
  {
    return lhs.getValue(env) + rhs.getValue(env);
  };
};

Subtract = function(lhs, rhs)
{
  this.toString = function(){return "(" + lhs.toString() + " - " + rhs.toString() + ")";};
  this.getValue = function(env)
  {
    return lhs.getValue(env) - rhs.getValue(env);
  };
};

Multiply = function(lhs, rhs)
{
  this.toString = function(){return lhs.toString() + " * " + rhs.toString();};
  this.getValue = function(env)
  {
    return lhs.getValue(env) * rhs.getValue(env);
  };
};

Divide = function(lhs, rhs)
{
  this.toString = function(){return lhs.toString() + " / " + rhs.toString();};
  this.getValue = function(env)
  {
    return lhs.getValue(env) / rhs.getValue(env);
  };
};

Power = function(lhs, rhs)
{
  this.toString = function(){return lhs.toString() + " ^ " + rhs.toString();};
  this.getValue = function(env)
  {
    return Math.pow(lhs.getValue(env), rhs.getValue(env));
  };
};

Constant = function(val)
{
  this.toString = function(){return val;};
  this.getValue = function(env)
  {
    return val;
  };
};

Variable = function(name)
{
  this.toString = function(){return name;};
  this.getValue = function(env)
  {
    if(env[name] == undefined)
      throw new Error(name + " is not defined");
    return env[name].getValue(env);
  };
};
/*
UnaryFunction = function(name, arg)
{
  this.toString = function(){return name.charAt(0).toLowerCase() + name.slice(1) + "(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math[name.charAt(0).toLowerCase() + name.slice(1)](arg.getValue(env));
  };
};
*/

Log = function(arg)
{
  this.toString = function(){return "log(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.log(arg.getValue(env));
  };
};

Sinh = function(arg)
{
  this.toString = function(){return "sinh(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.sinh(arg.getValue(env));
  };
};

Cosh = function(arg)
{
  this.toString = function(){return "cosh(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.cos(arg.getValue(env));
  };
};

Tanh = function(arg)
{
  this.toString = function(){return "tanh(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.tanh(arg.getValue(env));
  };
};

Sin = function(arg)
{
  this.toString = function(){return "sin(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.sin(arg.getValue(env));
  };
};

Cos = function(arg)
{
  this.toString = function(){return "cos(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.cos(arg.getValue(env));
  };
};

Tan = function(arg)
{
  this.toString = function(){return "tan(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.tan(arg.getValue(env));
  };
};

ArcSin = function(arg)
{
  this.toString = function(){return "asin(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.asin(arg.getValue(env));
  };
};

ArcCos = function(arg)
{
  this.toString = function(){return "acos(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.acos(arg.getValue(env));
  };
};

ArcTan = function(arg)
{
  this.toString = function(){return "atan(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.atan(arg.getValue(env));
  };
};

Floor = function(arg)
{
  this.toString = function(){return "floor(" + arg + ")";};
  this.getValue = function(env)
  {
    return Math.floor(arg.getValue(env));
  };
};

Negative = function(arg)
{
  this.toString = function(){return "-" + arg;};
  this.getValue = function(env)
  {
    return -arg.getValue(env);
  };
};



function parseValue(value_str){
  var ExprParser = CharCombinator.define(
    function() {
      with(this) {
        this.nat = many1(digit) ['>>='] (function (n) { return ret(new Constant(parseInt(n.join('')))); });
        this.token = function(p) { return between(spaces, spaces, p); };
        this.natural = token(nat);
        this.symbol = function(c) { return token(chr(c)); };
        this.minus = between(symbol('-'), spaces, lazy(function() { return factor; })) ['>>='] (function(x) { return ret(new Negative(x)); });
        this.pi = string("Pi")['>>='] (function (n) {return ret(new Constant(Math.PI));}); 
        /*this.unary_function = or(string("Log"), string("Cosh"), string("Sinh"), string("Cos"), string("Sin"), string("Tan"), string("ArcCos"), string("ArcSin"), string("ArcTan"))
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new UnaryFunction(name.join(''), expr_str)))})});
                                */
        this.log = string("Log")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Log(expr_str)))})});
        this.sinh = string("Sinh")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Sinh(expr_str)))})});
        this.cosh = string("Cosh")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Cosh(expr_str)))})});
        this.tanh = string("Tanh")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Tanh(expr_str)))})});
        this.sin = string("Sin")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Sin(expr_str)))})});
        this.cos = string("Cos")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Cos(expr_str)))})});
        this.tan = string("Tan")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Tan(expr_str)))})});
        this.asin = string("ArcSin")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new ArcSin(expr_str)))})});
        this.acos = string("ArcCos")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new ArcCos(expr_str)))})});
        this.atan = string("ArcTan")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new ArcTan(expr_str)))})});
        this.floor = string("Floor")
        ['>>='](function(name){ return symbol('[') ['>>'] (expr)
                                ['>>='] (function(expr_str){ return  (symbol(']'))['>>'] (ret(new Floor(expr_str)))})});
        this.parameter = symbol('p')
        ['>>'] (symbol('['))
        ['>>'] (many1(or(letter,digit)))
        ['>>='] (function (par){ return (symbol(','))
                                 ['>>'] (optional(symbol('-')))
                                 ['>>='] (function(minus_sign){ return (many1(digit))
                                                                ['>>='] (function (dif){ return (symbol(','))
                                                                                         ['>>'] (many1(digit))
                                                                                         ['>>='] (function (num){ return (symbol(']'))
                                                                                                                  ['>>'] (ret(new Variable("p[" + par.join('') + ", " + ((minus_sign == null)?"":minus_sign) + dif.join('') + ", " + num.join('') + "]")));});});});});
        this.variable = many1(or(or(letter,digit),symbol('\''))) ['>>=']
        (function (variable){
          var var_str = variable.join('');
          if(current_hydat.variables.indexOf(var_str) < 0)throw new Error("Parsing Error: variable " + var_str + " doesn't exist");
          return ret(new Variable(var_str));
        });
        this.time = symbol('t') ['>>='] (function (n) {return ret(new Variable("t"));});
        this.e = symbol('E')['>>='] (function (n) {return ret(new Constant(Math.E));});
        // TODO: consider handling of Infinity
        this.inf = string("Infinity")['>>='] (function (n) {return ret("Infinity");}); 

        this.factor = between(symbol('('), symbol(')'), lazy(function() { return expr; })) ['>>='] (function(x) { return ret(x); })
        ['<|>'] (natural)
        ['<|>'] (minus)
        ['<|>'] (time)
        ['<|>'] (inf)
        ['<|>'] (pi)
        ['<|>'] (e)
        //['<|>'] (unary_function)
        ['<|>'] (log)
        ['<|>'] (sinh)
        ['<|>'] (cosh)
        ['<|>'] (tanh)
        ['<|>'] (sin)
        ['<|>'] (cos)
        ['<|>'] (tan)
        ['<|>'] (asin)
        ['<|>'] (acos)
        ['<|>'] (atan)
        ['<|>'] (floor)
        ['<|>'] (parameter)
        ['<|>'] (variable);

        this.factor2 = chainl1(factor,symbol('^') ['>>'] (ret(function(x, y) { return new Power(x, y); })));
        this.term = chainl1(factor2,
                            or(symbol('*') ['>>'] (ret(function(x, y) { return new Multiply(x, y); })),
                               symbol('/') ['>>'] (ret(function(x, y) { return new Divide(x, y); }))));
        this.expr = chainl1(term,
                            or(symbol('+') ['>>'] (ret(function(x, y) { return new Plus(x, y); })),
                               symbol('-') ['>>'] (ret(function(x, y) { return new Subtract(x, y); }))));
      }
    });
  var result = ExprParser.expr.parse(value_str);
  if (result === null || result[1].length > 0) throw new Error("Parsing error: " + value_str);
  return result[0];
}
