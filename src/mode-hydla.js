import "ace-builds/webpack-resolver";

export function defineHydlaMode(ace) {
  ace.define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (require, exports, module) {
    "use strict";

    var Range = require("ace/range").Range;
    var MatchingBraceOutdent = function () { };

    (function () {
      this.checkOutdent = function (line, input) {
        if (! /^\s+$/.test(line))
          return false;

        return /^\s*\}/.test(input);
      };

      this.autoOutdent = function (doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({ row: row, column: column });

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column - 1), indent);
      };

      this.$getIndent = function (line) {
        return line.match(/^\s*/)[0];
      };

    }).call(MatchingBraceOutdent.prototype);

    exports.MatchingBraceOutdent = MatchingBraceOutdent;
  });

  ace.define("ace/mode/hydla_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/lib/lang", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("ace/lib/oop");
    var lang = require("ace/lib/lang");
    var TextHighlightRules = require("ace/text_highlight_rules").TextHighlightRules;

    var HydLaHighlightRules = function () {
      var keywords = "<<|=>|<=>|:=|\\bASSERT\\b";
      var constraint = "\\b[A-Z][A-Z0-9_]*\\b";
      // var numeric = "\\b[0-9]+(\\.[0-9]+)?\\b";
      var variable = "\\b[a-z][a-z0-9_]*\\b";
      var set = "\\b[a-zA-Z][a-zA-Z0-9_]*\\b";
      var logic_ops = "\\||&|/\\\\|\\\\/|\\[]";
      var builtin_consts = "\\b(?:Pi|E)\\b|\\$(t|timer|TRUE)\\b";
      var builtin_fns = "\\b(?:a?(?:sin|cos|tan)|l(?:n|og)|or|and|sum)\\b|\\.\\.";

      this.$rules = {

        "start": [
          {
            token: "comment.line", // line comment
            regex: "//.*$"
          },
          {
            token: "comment.block", // multiline comment
            merge: true,
            regex: "/\\*",
            next: "comment"
          },
          {
            token: "keyword.control", // basic keywords
            regex: keywords
          },
          // { token : "constant.numeric", // numeric constant
          //    regex : numeric },
          {
            token: "entity.name.function", // constraint with no args
            regex: constraint + "(?=\\s*(<=>|{))"
          },
          {
            token: "entity.name.function", // constraint with some args
            regex: constraint + "(?=\\([^)]*\\)\\s*(<=>|{))",
            next: "args"
          },
          {
            token: "variable.other", // set definition
            regex: set + "(?=\\s*:=)"
          },
          {
            token: "string.other", // set cardinality
            regex: "\\|\\s*" + set + "\\s*\\|"
          },
          {
            token: ["variable.parameter", "support.variable"], // set iteration
            regex: "(" + variable + ")(\\s*\\bin\\b)"
          },
          {
            token: "support.variable", // set start
            regex: "{",
            next: "set"
          },
          {
            token: "support.variable", // set end
            regex: "}"
          },
          {
            token: "support.variable", // logial operators
            regex: logic_ops
          },
          {
            token: "constant.language", // builtin constants: Pi and E
            regex: builtin_consts
          },
          {
            token: "support.function", // builtin functions: sin, cos, ...etc
            regex: builtin_fns
          }
        ],

        "args": [          // argument-list of constraint definition
          {
            token: "comment.line", // line comment
            regex: "//.*$"
          },
          {
            token: "comment.block", // block comment
            merge: true,
            regex: "/\\*",
            next: "args-comment"
          },
          {
            token: "variable.parameter", // constraint parameter
            regex: variable
          },
          {
            token: "text", // end of argument-list
            regex: "\\)",
            next: "start"
          }
        ],

        "set": [           // hilight set literal
          {
            token: ["variable.parameter", "text"], // {x, y, z}
            regex: "(\\s*" + variable + ")(\\s*(?:,|(?=})))"
          },
          {
            token: ["variable.parameter", "support.function"], // {x1 .. x5}
            regex: "(\\s*" + variable + ")(\\s*\\.\\.)"
          },
          {
            token: "text", // not a set literal => back to "start"
            regex: "",
            next: "start"
          }
        ],

        "comment": [       // body of multiline comment
          { token: "comment.block", merge: true, regex: "([^*]|\\*($|[^/]))+" },
          { token: "comment.block", merge: true, regex: "\\*/", next: "start" }
        ],

        "args-comment": [  // multiline comment in arglist
          { token: "comment.block", merge: true, regex: "([^*]|\\*($|[^/]))+" },
          { token: "comment.block", merge: true, regex: "\\*/", next: "args" }
        ],
      };
    };

    oop.inherits(HydLaHighlightRules, TextHighlightRules);
    exports.HydLaHighlightRules = HydLaHighlightRules;
  });

  ace.define("ace/mode/hydla", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/matching_brace_outdent", "ace/mode/hydla_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("ace/lib/oop");
    var TextMode = require("ace/text").Mode;
    var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
    var HydLaHighlightRules = require("./hydla_highlight_rules").HydLaHighlightRules;

    var Mode = function () {
      this.HighlightRules = HydLaHighlightRules;
      this.$outdent = new MatchingBraceOutdent();
    };
    oop.inherits(Mode, TextMode);

    (function () {
      this.lineCommentStart = ["//"];
      this.blockComment = { start: "/*", end: "*/" };

      this.getNextLineIndent = function (state, line, tab) {
        var indent = this.$getIndent(line);
        var tokens = this.getTokenizer().getLineTokens(line, state).tokens;

        var count_parens = (line.match(/[{([]/g) || []).length
          - (line.match(/[\])}]/g) || []).length;

        // if the last line is comment, do not change indent
        if (tokens.length && tokens[tokens.length - 1].type == "comment") {
          return indent;
        }

        // otherwise, increase/decrease appropriately
        while (count_parens > 0) {
          indent += tab;
          count_parens--;
        }
        while (count_parens < 0) {
          indent = indent.replace(tab, "");
          count_parens++;
        }

        return indent;
      };

      this.checkOutdent = function (state, line, input) {
        return this.$outdent.checkOutdent(line, input);
      };

      this.autoOutdent = function (state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
      };

      this.$id = "ace/mode/hydla";

    }).call(Mode.prototype);

    exports.Mode = Mode;
  });


}