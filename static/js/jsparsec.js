var Combinator = function(fun) {
    if (typeof fun === 'function')
        this.parse = fun;
};
Combinator.define = function(fun) {
    var c = new this();
    fun.call(c);
    return c;
};
Combinator._rjoin = function(fun) {
    return function self(x1, x2) {
        if (arguments.length > 2)
            return self.call(this, x1,
                             self.apply(this, Array.prototype.slice.call(arguments, 1)));
        return fun.call(this, x1, x2);
    };
};

Combinator.prototype = {
    create: function(fun) { return new Combinator(fun); },
    lazy: function(fun) {
        return this.create(function(input) {
            return fun.call(this).parse(input);
        });
    },
    ret: function(value) {
        return this.create(function(input) { return [value, input]; });
    },
    failure: function() {
        return this.create(function(input) { return null; });
    },
    item: function() {
        return this.create(function(input) {
            if (input.length === 0) return null;
            return [input[0], input.slice(1)];
        });
    },
    eof: function() {
        return this.create(
            function(input) {
                if (input.length === 0) return [[], input];
                return null;
            });
    },
    bind: Combinator._rjoin(function(p, f) {
        return this.create(function(input) {
            var result = p.parse(input);
            if (result === null)
                return null;
            return f.call(this, result[0]).parse(result[1]);
        });
    }),
    bind2: Combinator._rjoin(function(p1, p2) {
        return this.create(function(input) {
            var result = p1.parse(input);
            if (result === null)
                return null;
            return p2.parse(result[1]);
        });
    }),
    or: Combinator._rjoin(function(p1, p2) {
        return this.create(function(input) {
            var result = p1.parse(input);
            if (result === null)
                return p2.parse(input);
            return result;
        });
    }),
    forward: Combinator._rjoin(function (p1, p2) {
        return this.create(function (input) {
            var result = p1.parse(input);
            if (result === null) {
                return null;
            }
            var result2 = p2.parse(result[1]);
            if (result2 === null) {
                return null;
            }
            return result;
        });
    }),
    many: function(p) { return this.many1(p) ['<|>'] (this.ret([])); },
    many1: function(p) {
        return p ['>>='] (function(x) {
            return this.many(p) ['>>='] (function(xs) {
                return this.ret([x].concat(xs));
            });
        });
    },
    skipMany: function(p) { return this.skipMany1(p) ['<|>'] (this.ret(null)); },
    skipMany1: function(p) {
        // 無限再帰を避けるために関数呼び出しを間に挟む
        return p ['>>='] (function() { return this.skipMany(p); }) ['>>'] (this.ret(null));
    },
    choice: function(array) { return this.or.apply(this, array); },
    option: function(p, x) { return p ['<|>'] (this.ret(x)); },
    optional: function(p) { return p ['>>='] (function(x) { return this.ret(x);}) ['<|>'] (this.ret(null)); },
    between: function(open, close, p) {
        return open ['>>'] (p) ['>>='] (function(p) {
           return close ['>>'] (this.ret(p));
        });
    },
    sepBy: function(p, sep) { return this.sepBy1(p, sep) ['<|>'] (this.ret([])); },
    sepBy1: function(p, sep) {
        return p ['>>='] (function(x) {
            return this.many(sep ['>>'] (p)) ['>>='] (function(xs) {
                return this.ret([x].concat(xs));
            });
        });
    },
    sepEndBy1: function(p, sep) {
        return p ['>>='] (function(x) {
            return sep ['>>'] (this.sepEndBy(p, sep)) ['>>='] (function(xs) {
                return this.ret([x].concat(xs));
            }) ['<|>'] (this.ret([x]));
        });
    },
    sepEndBy: function(p, sep) { return this.sepEndBy1(p, sep) ['<|>'] (this.ret([])); },
    endBy1: function(p, sep) {
        return this.many1 (p ['>>='] (function(x) { return sep ['>>'] (this.ret(x)); }));
    },
    endBy: function(p, sep) {
        return this.many (p ['>>='] (function(x) { return sep ['>>'] (this.ret(x)); }));
    },
    count: function(n, p) {
        if (n <= 0)
            return this.ret([]);
        return p ['>>='] (function(x) {
            return this.count(n-1, p) ['>>='] (function(xs) {
                return this.ret([x].concat(xs));
            });
        });
    },
    chainr: function(p, op, x) { return this.chainr1(p, op) ['<|>'] (this.ret(x)); },
    chainl: function(p, op, x) { return this.chainl1(p, op) ['<|>'] (this.ret(x)); },
    chainl1: function(p, op) {
        var self = this;
        return p ['>>='] (function(x) { return rest(x); });
        function rest(x) {
            return op ['>>='] (function(f) {
                return p ['>>='] (function(y) { return rest(f(x, y)); });
            }) ['<|>'] (self.ret(x));
        }
    },
    chainr1: function(p, op) {
        var self = this;
        return scan();
        function scan() { return p ['>>='] (function(x) { return rest(x); }); }
        function rest(x) {
            return op ['>>='] (function(f) {
                return scan() ['>>='] (function(y) { return rest(f(x, y)); });
            }) ['<|>'] (self.ret(x));
        }
    },
    manyTill: function(p, end) {
        var self = this;
        return scan();
        function scan() {
            return (end ['>>'] (self.ret([]))) ['<|>'] (p ['>>='] (function(x) {
                return scan() ['>>='] (function(xs) { return self.ret([x].concat(xs)); });
            }));
        }
    }
};
Combinator.prototype['>>='] = function(other) { return this.bind(this, other); };
Combinator.prototype['>>']  = function(other) { return this.bind2(this, other); };
Combinator.prototype['<|>'] = function(other) { return this.or(this, other); };

var CharCombinator = function(fun) { Combinator.call(this, fun); };
CharCombinator.define = Combinator.define;
CharCombinator.prototype = Combinator.define(
    function() {
        this.satisfy = function(cond) {
            return this.item() ['>>='] (function(x) {
                if (cond(x)) return this.ret(x);
                return this.failure();
            });
        };
        this.match = function(reg) {
            return this.satisfy(function(x) { return reg.test(x); });
        };
        
        this.chr = function(c) { return this.satisfy(function(x) { return c == x; }); };
        this.oneOf = function(s) {
            s = Array.prototype.slice.call(s);
            this.satisfy(function(x) { return s.indexOf(x) !== -1; });
        };
        this.noneOf = function(s) {
            s = Array.prototype.slice.call(s);
            this.satisfy(function(x) { return s.indexOf(x) === -1; });
        };
        this.anyChar = this.item();

        this.space = this.match(/^\s$/);
        this.spaces = this.skipMany(this.space);
        this.newline = this.chr('\n');
        this.tab = this.chr('\t');

        this.upper = this.match(/^[A-Z]$/);
        this.lower = this.match(/^[a-z]$/);
        this.alphaNum = this.or(this.digit, this.letter);
        this.letter = this.or(this.lower, this.upper);

        this.digit = this.match(/^\d$/);
        this.hexDigit = this.match(/^[\da-fA-F]$/);
        this.octDigit = this.match(/^[0-7]$/);
        this.string = function(s) {
            if (s.length == 0) return this.ret([]);
            return this.chr(s[0]) ['>>'] (
                this.string(s.slice(1))) ['>>'] (
                    this.ret(Array.prototype.slice.call(s)));
        };
    });
