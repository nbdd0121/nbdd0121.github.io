(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var NorlitJSCompiler = {};
module.exports = NorlitJSCompiler;

NorlitJSCompiler.Warning = function() {
	function Warning(message) {
		this.stack = (new Error).stack || [];
		this.message = message;
	}

	Warning.prototype = Error.prototype;
	Warning.prototype.name = "Warning";
	return Warning;
}();

NorlitJSCompiler.Context = function() {
	function Context(tolerance) {
		this.errors = [];
		this.warnings = [];
		this.tolerance = !!tolerance;
	}

	Context.prototype.throwError = function(error) {
		if (this.tolerance) {
			this.errors.push(error);
		} else {
			throw error;
		}
	}

	Context.prototype.throwWarning = function(w) {
		this.warnings.push(w);
	}

	Context.prototype.lastError = function() {
		return this.errors[this.errors.length - 1];
	}

	Context.prototype.hasError = function() {
		return this.errors.length;
	}
	return Context;
}();

/* Defines NorlitJSCompiler.CharType */
require("./syntax/chartype");
/* Defines NorlitJSCompiler.Lex & NorlitJSCompiler.Token */
require("./syntax/lex");
/* Defines NorlitJSCompiler.Parser & NorlitJSCompiler.Node */
require("./syntax/grammar");

NorlitJSCompiler.Visitor = require("./visitor.js");
NorlitJSCompiler.ASTPass = (function() {
	var ASTPass = [];
	ASTPass.register = function(a) {
		ASTPass.push(a);
	}
	ASTPass.applyAll = function(ast) {
		NorlitJSCompiler.ASTPass.forEach(function(pass) {
			ast = NorlitJSCompiler.Visitor.traverse(ast, pass) || ast;
		});
		return ast;
	}
	ASTPass.apply = function(ast, pass) {
		return NorlitJSCompiler.Visitor.traverse(ast, pass) || ast;
	}
	return ASTPass;
})();

require("./const.js");
},{"./const.js":2,"./syntax/chartype":5,"./syntax/grammar":6,"./syntax/lex":7,"./visitor.js":8}],2:[function(require,module,exports){
'use strict';

var NorlitJSCompiler = require("./compiler");

var ASTBuilder = NorlitJSCompiler.ASTBuilder;

NorlitJSCompiler.ASTPass.register({
	leave: function(node, parent) {
		switch (node.type) {
			case 'Symbol':
			case 'ThisExpression':
			case 'Constant':
			case 'FunctionExpression':
				{
					node.sideEffect = false;
					break;
				}
			case 'EmptyStatement':
				{
					node.sideEffect = false;
					break;
				}
			case 'ExpressionStatement':
				{
					if (!node.expression.sideEffect) {
						node = new NorlitJSCompiler.Node('EmptyStatement');
						node.sideEffect = false;
						return node;
					}
					node.sideEffect = true;
					break;
				}
			case 'IfStatement':
				{
					if (node.false && !node.false.sideEffect) {
						node.false = undefined;
					}
					if (!node.true.sideEffect) {
						node.true = undefined;
					}
					if (node.true === undefined && node.false === undefined) {
						if (node.test.sideEffect) {
							var wrap = new NorlitJSCompiler.Node('ExpressionStatement');
							wrap.expression = node.test;
							wrap.sideEffect = true;
							return wrap;
						} else {
							return NorlitJSCompiler.Node.EMPTY;
						}
					}
					if (node.true === undefined) {
						var wrap = new NorlitJSCompiler.Node('UnaryExpression');
						wrap.operator = '!';
						wrap.operand = node.test;
						wrap.sideEffect = node.test.sideEffect;
						node.test = wrap;
						node.true = node.false;
						node.false = undefined;
					}
					if (node.test.type == 'Constant') {
						if (node.test.value) {
							return node.true;
						} else {
							return node.false === undefined ? NorlitJSCompiler.Node.EMPTY : node.false;
						}
					}
					if (node.false) {
						node.sideEffect = node.test.sideEffect || node.true.sideEffect;
					} else {
						node.sideEffect = node.test.sideEffect || node.true.sideEffect || node.false.sideEffect;
					}
					break;
				}
			case 'BlockStatement':
				{
					for (var i = 0; i < node.body.length; i++) {
						if (!node.body[i].sideEffect) {
							node.body.splice(i, 1);
							i--;
						}
					}
					node.sideEffect = node.body.length != 0;
					break;
				}
			case 'BinaryExpression':
				{
					if (node.left.type == 'Constant' && node.right.type != 'Constant') {
						switch (node.operator) {
							case '&&':
								{
									return node.left.value ? node.right : node.left;
								}
							case '||':
								{
									return node.left ? node.left : node.right;
								}
						}
					} else if (node.left.type == 'Constant' && node.right.type == 'Constant') {
						var l = node.left.value,
							r = node.right.value;
						switch (node.operator) {
							case '*':
								return ASTBuilder.wrapConstant(l * r);
							case '/':
								return ASTBuilder.wrapConstant(l / r);
							case '%':
								return ASTBuilder.wrapConstant(l % r);
							case '+':
								return ASTBuilder.wrapConstant(l + r);
							case '-':
								return ASTBuilder.wrapConstant(l - r);
							case '<<':
								return ASTBuilder.wrapConstant(l << r);
							case '>>':
								return ASTBuilder.wrapConstant(l >> r);
							case '>>>':
								return ASTBuilder.wrapConstant(l >>> r);
							case '<':
								return ASTBuilder.wrapConstant(l < r);
							case '>':
								return ASTBuilder.wrapConstant(l > r);
							case '<=':
								return ASTBuilder.wrapConstant(l <= r);
							case '>=':
								return ASTBuilder.wrapConstant(l >= r);
							case 'instanceof':
							case 'in':
								throw new TypeError("TypeCheckError");
							case '==':
								return ASTBuilder.wrapConstant(l == r);
							case '!=':
								return ASTBuilder.wrapConstant(l != r);
							case '===':
								return ASTBuilder.wrapConstant(l === r);
							case '!==':
								return ASTBuilder.wrapConstant(l !== r);
							case '&':
								return ASTBuilder.wrapConstant(l & r);
							case '|':
								return ASTBuilder.wrapConstant(l | r);
							case '^':
								return ASTBuilder.wrapConstant(l ^ r);
							case '&&':
								return ASTBuilder.wrapConstant(l && r);
							case '||':
								return ASTBuilder.wrapConstant(l || r);
							case ',':
								return node.right;
							default:
								throw 'Operation ' + node.operator;
						}
					}
					node.sideEffect = node.left.sideEffect | node.right.sideEffect;
					break;
				}
			case 'ConditionalExpression':
				{
					if (node.test.type == 'Constant') {
						return node.test.value ? node.true : node.false;
					}
					node.sideEffect = node.test.sideEffect || node.true.sideEffect || node.false.sideEffect;
					break;
				}
			case 'UnaryExpression':
				{
					if (!node.operand.sideEffect) {
						switch (node.operator) {
							case 'delete':
								{
									return ASTBuilder.wrapConstant(true);
								}
							case 'void':
								{
									return ASTBuilder.wrapConstant(undefined);
								}
						}
					}
					if (node.operand.type == 'Constant') {
						var v = node.operand.value;
						switch (node.operator) {
							case '+':
								return ASTBuilder.wrapConstant(+v);
							case '-':
								return ASTBuilder.wrapConstant(-v);
							case 'typeof':
								return ASTBuilder.wrapConstant(typeof(v));
							case '++':
								throw new TypeError("TypeCheckError");
							case '--':
								throw new TypeError("TypeCheckError");
							case '!':
								return ASTBuilder.wrapConstant(!v);
							case '~':
								return ASTBuilder.wrapConstant(~v);
							default:
								throw 'Operation ' + node.operator;
						}
					}
					switch (node.operator) {
						case 'delete':
						case '++':
						case '--':
							node.sideEffect = true;
							break;
						case 'void':
						case '+':
						case '-':
						case 'typeof':
						case '!':
						case '~':
							node.sideEffect = node.operand.sideEffect;
							break;
						default:
							throw 'Operation ' + node.operator;
					}
					break;
				}
			default:
				{
					node.sideEffect = true;
					break;
				}
		}
	},
	noLiteralVisit: true
});
},{"./compiler":1}],3:[function(require,module,exports){
var NorlitJSCompiler = require("../compiler");

var minifyNumber = function() {
    function pickAlternative(array) {
        var minLength = Number.MAX_VALUE;
        var minA = null;
        for (var i = 0; i < array.length; i++) {
            var a = array[i];
            var heuristicLength = a.str.length + precedent.indexOf(a.p) / precedent.length * 2;
            if (heuristicLength < minLength) {
                minLength = heuristicLength;
                minA = a;
            }
        }
        return minA;
    }

    function fraction(x) {
        var abs = Math.abs(x);
        var sign = x / abs;

        function recursiveToFraction(number, stackDepth) {
            var integerPart = Math.floor(number);
            var decimalPart = number - integerPart;
            if (decimalPart < 0.0001 || stackDepth > 20) return [integerPart, 1];
            var num = recursiveToFraction(1 / decimalPart, stackDepth + 1);
            return [integerPart * num[0] + num[1], num[0]]
        }
        var fraction = recursiveToFraction(abs, 0);
        if (sign * fraction[0] / fraction[1] != x) {
            return null;
        }
        return {
            str: (sign == -1 ? '-' : '') + fraction[0] + "/" + fraction[1],
            p: '*'
        };
    }

    return function(num) {
        var p = num < 0 ? "UnaryExpression" : "PrimaryExpression";
        var alternatives = [];
        alternatives.push({
            str: function() {
                var str = num.toString().replace("e+", "e");
                if (str[0] == '0' && str[1] == '.') {
                    str = str.substr(1);
                }
                return str;
            }(),
            p: p
        });
        if (parseInt(num) == num) {
            alternatives.push({
                str: "0x" + num.toString(16).toUpperCase(),
                p: p
            });
        }
        alternatives.push({
            str: num.toExponential().replace("e+", "e"),
            p: p
        });
        var f = fraction(num);
        if (f) {
            alternatives.push(f);
        }
        return pickAlternative(alternatives);
    }
}();

function minifyString(str) {
    var single = "'";
    var double = '"';
    for (var i = 0; i < str.length; i++) {
        switch (str[i]) {
            case '\0':
                single += '\\0';
                double += '\\0';
                break;
            case '"':
                single += '"';
                double += '\\"';
                break;
            case "'":
                single += "\\'";
                double += "'";
                break;
            case '\\':
                single += '\\\\';
                double += '\\\\';
                break;
            case '\b':
                single += '\\b';
                double += '\\b';
                break;
            case '\f':
                single += '\\f';
                double += '\\f';
                break;
            case '\n':
                single += '\\n';
                double += '\\n';
                break;
            case '\r':
                single += '\\r';
                double += '\\r';
                break;
            case '\t':
                single += '\\t';
                double += '\\t';
                break;
            case '\v':
                single += '\\v';
                double += '\\v';
                break;
            default:
                switch (NorlitJSCompiler.CharType(str[i])) {
                    case 'LOWERCASE_LETTER':
                    case 'UPPERCASE_LETTER':
                    case 'OTHER_LETTER':
                    case 'DECIMAL_DIGIT_NUMBER':
                    case 'CONNECTOR_PUNCTUATION':
                    case 'MATH_SYMBOL':
                    case 'DASH_PUNCTUATION':
                    case 'OTHER_PUNCTUATION':
                    case 'END_PUNCTUATION':
                    case 'START_PUNCTUATION':
                    case 'MODIFIER_SYMBOL':
                    case 'SPACE_SEPARATOR':
                    case 'CURRENCY_SYMBOL':
                        single += str[i];
                        double += str[i];
                        break;
                    case 'CONTROL':
                    case 'FORMAT':
                    case 'LINE_SEPARATOR':
                    case 'PARAGRAPH_SEPARATOR':
                    case 'UNASSIGNED':
                    default:
                        {
                            var code = str[i].charCodeAt(0);
                            if (code < 0xFF) {
                                var escape = '\\x' + (0x100 + code).toString(16).substr(1).toUpperCase();
                            } else {
                                var escape = '\\u' + (0x10000 + code).toString(16).substr(1).toUpperCase();
                            }
                            single += escape;
                            double += escape;
                            break;
                        }
                }
        }
    }
    single += "'";
    double += '"';
    return {
        str: single.length > double.length ? double : single,
        p: 'PrimaryExpression'
    };
}

function isIdentifierName(str) {
    try {
        var lex = new NorlitJSCompiler.Lex(str);
        lex.parseId = false;
        return lex.nextToken().type == 'id' && lex.nextToken().type == 'eof';
    } catch (e) {
        return false;
    }
}

var precedent = [
    'PrimaryExpression',
    '.',
    'LeftHandSideExpression',
    'PostfixExpression',
    'UnaryExpression',
    '*',
    '+',
    '<<',
    '<',
    '==',
    '&',
    '^',
    '|',
    '&&',
    '||',
    'ConditionalExpression',
    'AssignmentExpression',
    'Expression'
];

function wrap(obj, p, ns) {
    var oi = precedent.indexOf(obj.p);
    var pi = precedent.indexOf(p);
    if (oi == -1 || pi == -1) {
        console.log(obj);
        throw new Error('Unexpected precedence of ' + obj.p + ' or ' + p);
    }
    if (pi < oi || (ns && pi == oi)) {
        return {
            str: '(' + obj.str + ')',
            p: 'PrimaryExpression'
        };
    }
    return obj;
}

function eliminateSemicolon(inBlock) {
    if (inBlock[inBlock.length - 1] == ';') {
        return inBlock.substr(0, inBlock.length - 1);
    }
    return inBlock;
}

function generateStmtArray(array) {
    return array.map(minifyToString).join("");
}

function minifyToString(ast) {
    return minify(ast).str;
}

function minify(ast) {
    switch (ast.type) {
        case 'Constant':
            {
                switch (typeof(ast.value)) {
                    case 'number':
                        return minifyNumber(ast.value);
                    case 'object':
                        return {
                            str: "null",
                            p: 'PrimaryExpression'
                        }
                    case 'string':
                        return minifyString(ast.value);
                    case 'boolean':
                        return {
                            str: '!' + Number(!ast.value),
                            p: "UnaryExpression"
                        }
                    case 'undefined':
                        return {
                            str: 'void 0',
                            p: 'UnaryExpression'
                        };
                    default:
                        return {
                            str: ast.value + "",
                            p: 'PrimaryExpression'
                        };
                }
            }
        case 'Identifier':
            {
                return {
                    str: ast.name,
                    p: 'PrimaryExpression'
                };
            }
        case 'Symbol':
            {
                return {
                    str: ast.name,
                    p: 'PrimaryExpression'
                };
            }
        case 'ThisExpression':
            {
                return {
                    str: "this",
                    p: 'PrimaryExpression'
                };
            }
        case 'RegexpLiteral':
            {
                return {
                    str: "/" + ast.regexp + "/" + ast.flags,
                    p: 'PrimaryExpression'
                };
            }
        case 'ObjectInitializer':
            {
                return {
                    str: "{" + ast.elements.map(minifyToString).join(",") + "}",
                    p: 'PrimaryExpression'
                };
            }
        case 'Property':
            {
                var name = (isIdentifierName(ast.key) || +ast.key + "" == ast.key) ? ast.key : minifyString(ast.key).str;
                return {
                    str: name + ":" + wrap(minify(ast.value), 'AssignmentExpression').str
                };
            }
        case 'Getter':
            {
                var str = "get " + ast.key + "(){"
                str += eliminateSemicolon(generateStmtArray(ast.body));
                str += "}";
                return {
                    str: str,
                };
            }
        case 'Setter':
            {
                var str = "set " + ast.key + "(" + ast.parameter + "){"
                str += eliminateSemicolon(generateStmtArray(ast.body));
                str += "}";
                return {
                    str: str,
                };
            }
        case 'ArrayInitializer':
            {
                var str = "[";
                for (var i = 0; i < ast.elements.length; i++) {
                    if (i != 0) {
                        str += ",";
                    }
                    if (ast.elements[i] !== undefined) {
                        str += wrap(minify(ast.elements[i]), 'AssignmentExpression').str;
                    } else if (i == ast.elements.length - 1) {
                        str += ",";
                    }
                }
                return {
                    str: str + "]",
                    p: 'PrimaryExpression'
                };
            }
        case 'MemberExpression':
            {
                var base = wrap(minify(ast.base), 'LeftHandSideExpression');
                if (ast.property.type == 'Constant' && typeof(ast.property.value) == 'string' && isIdentifierName(ast.property.value)) {
                    if (typeof(ast.base) == 'number' && base.p == 'PrimaryExpression' &&
                        base.str.indexOf('.') == -1 && base.str.indexOf('E') == -1) {
                        base.str += " ";
                    }
                    return {
                        str: base.str + '.' + ast.property.value,
                        p: '.'
                    }
                } else {
                    return {
                        str: base.str + '[' + minify(ast.property, 'Expression').str + ']',
                        p: '.'
                    }
                }
            }
        case 'NewExpression':
            {
                var str = 'new ' + wrap(minify(ast.constructor), '.').str;
                str += "(" + ast.arguments.map(function(a) {
                    return wrap(minify(a), 'AssignmentExpression').str;
                }).join(",") + ")";
                return {
                    str: str,
                    p: "LeftHandSideExpression"
                };
            }
        case 'CallExpression':
            {
                var str = wrap(minify(ast.callee), 'LeftHandSideExpression').str + '(';
                for (var i = 0; i < ast.arguments.length; i++) {
                    if (i != 0) {
                        str += ",";
                    }
                    str += wrap(minify(ast.arguments[i]), 'AssignmentExpression').str;
                }
                return {
                    str: str + ")",
                    p: "LeftHandSideExpression"
                };
            }
        case 'PostfixExpression':
            {
                return {
                    str: wrap(minify(ast.operand), 'LeftHandSideExpression').str + ast.operator,
                    p: 'PostfixExpression'
                };
            }
        case 'UnaryExpression':
            {
                switch (ast.operator) {
                    case 'delete':
                    case 'void':
                    case 'typeof':
                        return {
                            str: ast.operator + " " + wrap(minify(ast.operand), 'UnaryExpression').str,
                            p: 'UnaryExpression'
                        };
                    case '+':
                    case '-':
                        var operand = wrap(minify(ast.operand), 'UnaryExpression').str;
                        if (operand[0] == ast.operator)
                            operand = ' ' + operand;
                        return {
                            str: ast.operator + operand,
                            p: 'UnaryExpression'
                        };
                    default:
                        return {
                            str: ast.operator + wrap(minify(ast.operand), 'UnaryExpression').str,
                            p: 'UnaryExpression'
                        };
                }
            }
        case 'BinaryExpression':
            {
                var type;
                switch (ast.operator) {
                    case '+':
                    case '-':
                        {
                            var right = wrap(minify(ast.right), '+', true).str;
                            if (right[0] == ast.operator)
                                right = ' ' + right;
                            return {
                                str: wrap(minify(ast.left), '+').str + ast.operator + right,
                                p: '+'
                            };
                        }
                    case '*':
                    case '/':
                    case '%':
                        type = '*';
                        break;
                    case '<<':
                    case '>>':
                    case '>>>':
                        type = '<<';
                        break;
                    case '<':
                    case '>':
                    case '<=':
                    case '>=':
                        type = '<';
                        break;
                    case 'instanceof':
                    case 'in':
                        return {
                            str: wrap(minify(ast.left), '<').str + " " + ast.operator + " " + wrap(minify(ast.right), '<', true).str,
                            p: '<'
                        };
                    case '==':
                    case '!=':
                    case '===':
                    case '!==':
                        type = '==';
                        break;
                    case '&':
                    case '^':
                    case '|':
                    case '&&':
                    case '||':
                        type = ast.operator;
                        break;
                    case ',':
                        type = 'Expression';
                        break;
                    default:
                        throw 'BinaryExpression ' + ast.operator;
                }
                return {
                    str: wrap(minify(ast.left), type).str + ast.operator + wrap(minify(ast.right), type, true).str,
                    p: type
                };
            }
        case 'ConditionalExpression':
            {
                return {
                    str: wrap(minify(ast.test), '||').str + "?" +
                        wrap(minify(ast.true), 'AssignmentExpression').str + ":" +
                        wrap(minify(ast.false), 'AssignmentExpression').str,
                    p: 'ConditionalExpression'
                };
            }
        case 'AssignmentExpression':
            {
                return {
                    str: wrap(minify(ast.left), 'AssignmentExpression', true).str + ast.operator + wrap(minify(ast.right), 'AssignmentExpression').str,
                    p: 'AssignmentExpression'
                };
            }
        case 'DebuggerStatement':
            {
                return {
                    str: "debugger;"
                };
            }
        case 'EmptyStatement':
            {
                return {
                    str: ";"
                };
            }
        case 'BlockStatement':
            {
                return {
                    str: "{" + eliminateSemicolon(generateStmtArray(ast.body)) + "}"
                };
            }
        case 'IfStatement':
            {
                var str = "if(" + minify(ast.test).str + ")" + minify(ast.true).str;
                if (ast.false !== undefined) {
                    str += "else " + minify(ast.false).str;
                }
                return {
                    str: str
                };
            }
        case 'WithStatement':
            {
                return {
                    str: "with(" + minify(ast.base).str + ")" + minify(ast.body).str
                };
            }
        case 'WhileStatement':
            {
                return {
                    str: "while(" + minify(ast.test).str + ")" + minify(ast.body).str
                };
            }
        case 'DoStatement':
            {
                return {
                    str: "do " + minify(ast.body).str + "while(" + minify(ast.test).str + ");"
                };
            }
        case 'ForStatement':
            {
                var str = "for(";
                if (ast.init !== undefined) {
                    if (ast.init && ast.init.type == 'VariableDeclaration')
                        str += minify(ast.init).str;
                    else
                        str += minify(ast.init).str + ";";
                } else {
                    str += ";";
                }
                if (ast.test !== undefined) str += minify(ast.test).str;
                str += ";";
                if (ast.inc !== undefined) str += minify(ast.inc).str;
                str += ")" + minify(ast.body).str;
                return {
                    str: str
                };
            }
        case 'ForInStatement':
            {
                var str = "for(";
                if (ast.var && ast.var.type == 'VariableDeclarator')
                    str += "var " + minify(ast.var).str;
                else
                    str += minify(ast.var).str;
                return {
                    str: str + " in " + minify(ast.container).str + ")" + minify(ast.body).str
                };
            }
        case 'TryStatement':
            {
                var str = "try " + minify(ast.body).str;
                if (ast.catch !== undefined) {
                    var param = ast.parameter;
                    if (param instanceof Object) {
                        param = param.name;
                    }
                    str += "catch(" + param + ")" + minify(ast.catch).str;
                }
                if (ast.finally !== undefined) {
                    str += "finally" + minify(ast.finally).str;
                }
                return {
                    str: str
                };
            }
        case 'SwitchStatement':
            {
                return {
                    str: "switch(" + minify(ast.expression).str + "){" +
                        eliminateSemicolon(generateStmtArray(ast.body)) + "}"
                };
            }
        case 'CaseClause':
            {
                if (ast.key === undefined) {
                    return {
                        str: "default:" + ast.body.map(minifyToString).join("")
                    };
                } else {
                    return {
                        str: "case " + minify(ast.key).str + ":" + ast.body.map(minifyToString).join("")
                    };
                }
            }
        case 'ReturnStatement':
            {
                if (ast.expression === undefined) {
                    return {
                        str: "return;"
                    };
                } else {
                    return {
                        str: "return " + minify(ast.expression).str + ";",
                    };
                }
            }
        case 'ThrowStatement':
            {
                return {
                    str: "throw " + minify(ast.expression).str + ";",
                };
            }
        case 'BreakStatement':
            {
                if (ast.label === undefined) {
                    return {
                        str: "break;"
                    };
                } else {
                    return {
                        str: "break " + ast.label + ";",
                    };
                }
            }
        case 'ContinueStatement':
            {
                if (ast.label === undefined) {
                    return {
                        str: "continue;"
                    };
                } else {
                    return {
                        str: "continue " + ast.label + ";",
                    };
                }
            }
        case 'LabeledStatement':
            {
                return {
                    str: ast.label + ":" + minify(ast.body).str
                };
            }
        case 'FunctionExpression':
        case 'FunctionDeclaration':
            {
                var str = "function";
                if (ast.name) {
                    str += " " + (ast.name instanceof Object ? ast.name.name : ast.name);
                }
                str += "(";
                str += ast.parameter.map(function(a) {
                    if (a instanceof Object) {
                        return a.name;
                    } else {
                        return a;
                    }
                }).join(",");
                str += "){";
                str += eliminateSemicolon(generateStmtArray(ast.body));
                str += "}";
                return {
                    str: str,
                    p: 'PrimaryExpression'
                };
            }
        case 'Program':
            {
                var str = "";
                for (var i = 0; i < ast.body.length; i++) {
                    str += minify(ast.body[i]).str;
                }
                return {
                    str: str
                };
            }
        case 'DirectiveStatement':
            {
                return {
                    str: ast.raw + ";"
                };
            }
        case 'ExpressionStatement':
            {
                var str = minify(ast.expression).str;
                if (typeof(ast.expression) == "string" || str.indexOf("function ") == 0 || str.indexOf("function(") == 0) {
                    return {
                        str: "(" + str + ");"
                    };
                } else {
                    return {
                        str: str.indexOf("function") == 0 ? "(" + str + ");" : str + ";"
                    };
                }
            }

        case 'VariableDeclaration':
            {
                var str = "var ";
                for (var i = 0; i < ast.declarations.length; i++) {
                    if (i != 0) {
                        str += ",";
                    }
                    str += minify(ast.declarations[i]).str;
                }
                return {
                    str: str + ";"
                };
            }
        case 'VariableDeclarator':
            {
                var name = ast.name;
                if (name instanceof Object) {
                    name = name.name;
                }
                if (ast.init !== undefined) {
                    return {
                        str: name + '=' + wrap(minify(ast.init), 'AssignmentExpression').str
                    };
                } else {
                    return {
                        str: name
                    };
                }
            }
        default:
            throw ast;
    }
}
var idStart = "_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var idPart = "_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function variableName(id) {
    var text = idStart[id % idStart.length];
    id = Math.floor(id / idStart.length);
    for (; id; id = Math.floor(id / idPart.length)) {
        text += idPart[id % idPart.length];
    }
    return text;
}

function wrapWithExprStmt(ast) {
    var replaceWrap = new NorlitJSCompiler.Node('ExpressionStatement');
    replaceWrap.expression = ast;
    return replaceWrap;
}

function wrapWithBlock(ast) {
    var replaceWrap = new NorlitJSCompiler.Node('BlockStatement');
    if (ast.type == 'EmptyStatement') {
        replaceWrap.body = [];
    } else {
        replaceWrap.body = [ast];
    }
    return replaceWrap;
}

exports.MinifyPass = {
    enter: function(node, parent) {
        switch (node.type) {
            case 'Program':
                {
                    node.scope.id = 0;
                    break;
                }
            case 'FunctionExpression':
            case 'FunctionDeclaration':
                {
                    var scope = node.scope;
                    var id = scope.outer.id;
                    if (scope.optimize) {
                        for (var i = 0; i < scope.var.length; i++) {
                            var symbol = scope.var[i];
                            var varName;
                            while (scope.outer.resolve(varName = variableName(id++)));
                            symbol.name = varName;
                        }
                    }
                    scope.id = id;
                    break;
                }
            case 'WithStatement':
                {
                    node.scope.id = node.scope.outer.id;
                }
            case 'TryStatement':
                {
                    if (node.scope !== undefined) {
                        var scope = node.scope;
                        var id = scope.outer.id;
                        if (scope.optimize) {
                            var symbol = scope.symbol;
                            var varName;
                            while (scope.outer.resolve(varName = variableName(id++)));
                            symbol.name = varName;
                            id++;
                        }
                        scope.id = id;
                    }
                    break;
                }
        }
    },
    leave: function(node, parent) {
        switch (node.type) {
            case 'ExpressionStatement':
                {
                    if (!(node.expression instanceof Object)) {
                        return new NorlitJSCompiler.Node('EmptyStatement');
                    }
                    break;
                }
            case 'IfStatement':
                {
                    if (node.false === undefined) {
                        if (node.true.type == 'ExpressionStatement') {
                            var replace = new NorlitJSCompiler.Node('BinaryExpression');
                            replace.operator = '&&';
                            replace.left = node.test;
                            replace.right = node.true.expression;
                            return wrapWithExprStmt(replace);
                        }
                    } else {
                        if (node.true.type == 'ExpressionStatement' && node.false.type == 'ExpressionStatement') {
                            var replace = new NorlitJSCompiler.Node('ConditionalExpression');
                            replace.test = node.test;
                            replace.true = node.true.expression;
                            replace.false = node.false.expression;
                            return wrapWithExprStmt(replace);
                        }
                    }
                    break;
                }
            case 'BlockStatement':
                {
                    for (var i = 0; i < node.body.length; i++) {
                        if (node.body[i].type == 'EmptyStatement') {
                            node.body.splice(i, 1);
                            i--;
                        }
                    }
                    if (node.body.length == 1) {
                        return node.body[0];
                    } else if (node.body.length == 0) {
                        return new NorlitJSCompiler.Node('EmptyStatement');
                    }
                    break;
                }
            case 'TryStatement':
                {
                    if (node.body !== undefined && node.body.type != 'BlockStatement') {
                        node.body = wrapWithBlock(node.body);
                    }
                    if (node.catch !== undefined && node.catch.type != 'BlockStatement') {
                        node.catch = wrapWithBlock(node.catch);
                    }
                    if (node.finally !== undefined && node.finally.type != 'BlockStatement') {
                        node.finally = wrapWithBlock(node.finally);
                    }
                    break;
                }
            case 'Program':
                {
                    for (var i = 0; i < node.body.length; i++) {
                        if (node.body[i].type == 'EmptyStatement') {
                            node.body.splice(i, 1);
                            i--;
                        }
                    }
                    break;
                }
        }

    },
    noLiteralVisit: true
};
exports.minify = minify;
},{"../compiler":1}],4:[function(require,module,exports){
var NorlitJSCompiler = require("./compiler");

var ASTBuilder = NorlitJSCompiler.ASTBuilder;

NorlitJSCompiler.ScopeAnalysis = function ScopeAnalysis(ast) {
	function Symbol(name) {
		this.name = name;
		this.type = "Symbol";
	}

	function DeclScope(outer) {
		this.optimize = true;
		this.outer = outer;
		this.var = [];
	}

	function WithScope(outer) {
		this.optimize = false;
		this.outer = outer;
		outer.disableOptimize();
	}

	function CatchScope(outer, param) {
		this.optimize = true;
		this.outer = outer;
		this.symbol = new Symbol(param);
	}

	function GlobalScope() {
		this.optimize = false;
		this.outer = null;
		this.var = [];
	}

	DeclScope.prototype.declare = GlobalScope.prototype.declare = function(name) {
		for (var i = 0; i < this.var.length; i++) {
			if (this.var[i].name == name) {
				return this.var[i];
			}
		}
		var symbol = new Symbol(name);
		this.var.push(symbol);
		return symbol;
	};

	DeclScope.prototype.resolve = function(name) {
		for (var i = 0; i < this.var.length; i++) {
			if (this.var[i].name == name) {
				return this.var[i];
			}
		}
		return this.outer.resolve(name);
	}

	WithScope.prototype.declare = function(name) {
		return this.outer.declare(name);
	}

	WithScope.prototype.resolve = function(name) {
		return null;
	}

	CatchScope.prototype.declare = function(name) {
		return this.outer.declare(name);
	}

	CatchScope.prototype.resolve = function(name) {
		if (this.symbol.name == name) {
			return this.symbol;
		}
		return this.outer.resolve(name);
	}

	GlobalScope.prototype.resolve = function(name) {
		return undefined;
	}

	DeclScope.prototype.disableOptimize =
		WithScope.prototype.disableOptimize =
		CatchScope.prototype.disableOptimize =
		GlobalScope.prototype.disableOptimize = function() {
			if (this.optimize) {
				this.optimize = false;
				if (this.outer)
					this.outer.disableOptimize();
			}
		}



	var scopeChain = [];
	var global = new GlobalScope();
	var scope = global;

	var scopeAnalyzer = {
		enter: function(ast, parent) {
			switch (ast.type) {
				case 'Program':
					{
						scopeChain.push(scope);
						scope = new DeclScope(scope);
						ast.scope = scope;
						break;
					}
				case 'FunctionExpression':
					{
						scopeChain.push(scope);
						scope = new DeclScope(scope);
						if (ast.name)
							ast.name = scope.declare(ast.name);
						for (var i = 0; i < ast.parameter.length; i++) {
							if (ast.parameter[i] == 'eval') {
								scope.disableOptimize();
							}
							ast.parameter[i] = scope.declare(ast.parameter[i]);
						}
						ast.scope = scope;
						break;
					}
				case 'FunctionDeclaration':
					{
						ast.name = scope.declare(ast.name);
						scopeChain.push(scope);
						scope = new DeclScope(scope);
						for (var i = 0; i < ast.parameter.length; i++) {
							if (ast.parameter[i] == 'eval') {
								scope.disableOptimize();
							}
							ast.parameter[i] = scope.declare(ast.parameter[i]);
						}
						ast.scope = scope;
						break;
					}
				case 'VariableDeclarator':
					{
						ast.name = scope.declare(ast.name);
						break;
					}
				case 'WithStatement':
					{
						scopeChain.push(scope);
						scope = new WithScope(scope);
						ast.scope = scope;
						break;
					}
				case 'TryStatement':
					{
						if (ast.parameter !== undefined) {
							NorlitJSCompiler.Visitor.traverse(ast.body, scopeAnalyzer);
							scopeChain.push(scope);
							scope = new CatchScope(scope, ast.parameter);
							ast.parameter = scope.symbol;
							ast.scope = scope;
							NorlitJSCompiler.Visitor.traverse(ast.catch, scopeAnalyzer);
							scope = scopeChain.pop();
							if (ast.finally !== undefined) {
								NorlitJSCompiler.Visitor.traverse(ast.finally, scopeAnalyzer);
							}
							return ast;
						}
						break;
					}
			}
		},
		leave: function(ast, parent) {
			switch (ast.type) {
				case 'Program':
				case 'FunctionExpression':
				case 'FunctionDeclaration':
					{
						//console.log('Analysis of ' + ast.type + " Yield " + JSON.stringify(scope.var));
						scope = scopeChain.pop();
						break;
					}
				case 'WithStatement':
					{
						//console.log('Leave With Scope');
						scope = scopeChain.pop();
						break;
					}

			}
		},
		noLiteralVisit: true
	};

	NorlitJSCompiler.Visitor.traverse(ast, scopeAnalyzer);

	var identifierResolver = {
		enter: function(ast, parent) {
			switch (ast.type) {
				case 'Program':
				case 'FunctionExpression':
				case 'FunctionDeclaration':
				case 'WithStatement':
					{
						scopeChain.push(scope);
						scope = ast.scope;
						break;
					}
				case 'TryStatement':
					{
						if (ast.parameter !== undefined) {
							NorlitJSCompiler.Visitor.traverse(ast.body, identifierResolver);
							scopeChain.push(scope);
							scope = ast.scope;
							NorlitJSCompiler.Visitor.traverse(ast.catch, identifierResolver);
							scope = scopeChain.pop();
							if (ast.finally !== undefined) {
								NorlitJSCompiler.Visitor.traverse(ast.finally, identifierResolver);
							}
							return ast;
						}
						break;
					}
				case 'CallExpression':
					{
						if (ast.callee.type == 'Identifier' & ast.callee.name == 'eval') {
							scope.disableOptimize();
						}
						break;
					}
			}
			if (ast.type == 'Identifier') {
				var symbol = scope.resolve(ast.name);
				if (symbol) {
					return symbol;
				} else {
					if (symbol === undefined) {
						if (ast.name == 'undefined') {
							return ASTBuilder.wrapConstant(undefined);
						}
					}
					global.declare(ast.name);
					return;
				}
			}
		},
		leave: function(ast, parent) {
			switch (ast.type) {
				case 'Program':
				case 'FunctionExpression':
				case 'FunctionDeclaration':
				case 'WithStatement':
					{
						scope = scopeChain.pop();
						break;
					}
			}
		},
		noLiteralVisit: true
	};

	NorlitJSCompiler.Visitor.traverse(ast, identifierResolver);
};
},{"./compiler":1}],5:[function(require,module,exports){
'use strict';

var NorlitJSCompiler = require("../compiler");

NorlitJSCompiler.CharType = function() {
	var types = ["UNASSIGNED", "UPPERCASE_LETTER", "LOWERCASE_LETTER", "TITLECASE_LETTER", "MODIFIER_LETTER", "OTHER_LETTER", "NON_SPACING_MARK", "ENCLOSING_MARK", "COMBINING_SPACING_MARK", "DECIMAL_DIGIT_NUMBER", "LETTER_NUMBER", "OTHER_NUMBER", "SPACE_SEPARATOR", "LINE_SEPARATOR", "PARAGRAPH_SEPARATOR", "CONTROL", "FORMAT", "PRIVATE_USE", "SURROGATE", "DASH_PUNCTUATION", "START_PUNCTUATION", "END_PUNCTUATION", "CONNECTOR_PUNCTUATION", "OTHER_PUNCTUATION", "MATH_SYMBOL", "CURRENCY_SYMBOL", "MODIFIER_SYMBOL", "OTHER_SYMBOL", "INITIAL_QUOTE_PUNCTUATION", "FINAL_QUOTE_PUNCTUATION"];
	var compressedType = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var plane0to2_type_map = ["FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFCNNNPNNNKLNONJNN9999999999NNOOONN11111111111111111111111111KNLQMQ22222222222222222222222222KOLOFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFCNPPPPRNQR5SOGRQROBBQ2NNQB5TBBBN11111111111111111111111O1111111222222222222222222222222O22222222", "1212121212121212121212121212121212121212121212121212121221212121212121212212121212121212121212121212121212121212121212121121212221121211211122111121121112221121121212112122121121112121122512225555132132132121212121212121221212121212121212122132121112121212", "12121212121212121212121212121212121212121212121212122222221121122121111212121212222222222222222222222222222222222222222222222222222222222222222222225222222222222222222222222222444444444444444444QQQQ444444444444QQQQQQQQQQQQQQ44444QQQQQQQ4Q4QQQQQQQQQQQQQQQQQ", "666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666612124Q12004222N00000QQ1N11101011211111111111111111011111111122222222222222222222222222222222222122111222121212121212121212121212222212O121122111", "1111111111111111111111111111111111111111111111112222222222222222222222222222222222222222222222221212121212121212121212121212121212R66666771212121212121212121212121212121212121212121212121212121121212121212122121212121212121212121212121212121212121212121212", "121212121212121212121212121212121212121200000000011111111111111111111111111111111111111004NNNNNN02222222222222222222222222222222222222220NJ0000P0666666666666666666666666666666666666666666666J6N66N66N60000000055555555555555555555555555500000555NN00000000000", "GGGGG0OOONNPNNRR66666666666N00NN55555555555555555555555555555555455555555556666666666666666666669999999999NNNN556555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555N56666666GR6666664466R6666559999999999555RR5", "NNNNNNNNNNNNNN0G56555555555555555555555555555555666666666666666666666666666005555555555555555555555555555555555555555555555555555555555555555555555555555555555555555566666666666500000000000000999999999955555555555555555555555555555555566666666644RNNN400000", "555555555555555555555566664666666666466646666600NNNNNNNNNNNNNNN0555555555555555555555555566600N00000000000000000000000000000000000000000000000000000000000000000505555555555500000000000000000000000000000000000000000000000000000006666666666666666666666666660", "6668555555555555555555555555555555555555555555555555555555686588866666666888868856666666555555555566NN9999999999N455555505555555068805555555500550055555555555555555555550555555505000555500658886666008800886500000000800005505556600999999999955PPBBBBBBRP0000", "066805555550000550055555555555555555555550555555505505505500608886600006600666000600000005555050000000999999999966555600000000000668055555555505550555555555555555555555505555555055055555006588866666066808860050000000000000005566009999999999NP00000000000000", "0688055555555005500555555555555555555555505555555055055555006586866660088008860000000068000055055566009999999999R5BBBBBB000000000065055555500055505555000550505500055000555000555555555555000088688000888088860050000008000000000000009999999999BBBRRRRRRPR00000", "088805555555505550555555555555555555555550555555555505555500056668888066606666000000066055000000556600999999999900000000BBBBBBBR00880555555550555055555555555555555555555055555555550555550065868888806880886600000008800000005055660099999999990550000000000000", "0088055555555055505555555555555555555555555555555555555555500588866660888088865000000008000000005566009999999999BBBBBB000R55555500880555555555555555555000555555555555555555555555055555555505005555555000600008886660608888888800000000000000000088N00000000000", "055555555555555555555555555555555555555555555555565566666660000P555555466666666N9999999999NN00000000000000000000000000000000000005505005505005000000555505555555055505050055055556556666660665005555504066666600999999999900555500000000000000000000000000000000", "5RRRNNNNNNNNNNNNNNNRNRRR66RRRRRR9999999999BBBBBBBBBBR6R6R6KLKL88555555550555555555555555555555555555555555555000066666666666666866666N66555556666666666606666666666666666666666666666666666660RRRRRRRR6RRRRRR0RRNNNNNRRRRNN0000000000000000000000000000000000000", "55555555555555555555555555555555555555555558866668666666866886659999999999NNNNNN555555886655556665888558888888555666655555555555556886688888865899999999998886RR1111111111111111111111111111111111111101000001005555555555555555555555555555555555555555555N4555", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555055550055555550505555005555555555555555555555555555555555555555505555005555555555555555555555555555555550555500555555505055550055555555555555505555555555555555555555555555555555555555", "555555555555555550555500555555555555555555555555555555555555555555555555555555555555555555500666NNNNNNNNNBBBBBBBBBBBBBBBBBBBB0005555555555555555RRRRRRRRRR000000555555555555555555555555555555555555555555555555555555555555555555555555555555555555500000000000", "J555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555NN55555555555555555C55555555555555555555555555KL000555555555555555555555555555555555555555555555555555555555555555555555555555NNNAAA000000000000000", "55555555555550555566600000000000555555555555555555666NN0000000005555555555555555556600000000000055555555555550555066000000000000555555555555555555555555555555555555555555555555555566866666668888888868866666666666NNN4NNNP56009999999999000000BBBBBBBBBB000000", "NNNNNNJNNNN666C0999999999900000055555555555555555555555555555555555455555555555555555555555555555555555555555555555555550000000055555555555555555555555555555555555555555650000055555555555555555555555555555555555555555555555555555555555555555555550000000000", "5555555555555555555555555555500066688886688800008868888886660000R000NN9999999999555555555555555555555555555555005555500000000000555555555555555555555555555555555555555555550000888888888888888885555555880000009999999999B000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", "555555555555555555555556688800NN55555555555555555555555555555555555555555555555555555868666666606868866666666888888666666666600699999999990000009999999999000000NNNNNNN4NNNNNN0000000000000000000000000000000000000000000000000000000000000000000000000000000000", "666685555555555555555555555555555555555555555555555568666668688888688555555500009999999999NNNNNNNRRRRRRRRRR666666666RRRRRRRRR0006685555555555555555555555555555558666688668688559999999999555555555555555555555555555555555555555555556866888686668800000000NNNN", "55555555555555555555555555555555555588888888666666668866000NNNNN99999999990005559999999999555555555555555555555555555555444444NN0000000000000000000000000000000000000000000000000000000000000000NNNNNNNN00000000666N66666666666668666666655556555588655000000000", "2222222222222222222222222222222222222222222244444444444444444444444444444444444444444444444444444444444444422222222222224222222222222222222222222222222222244444444444444444444444444444444444446666666666666666666666666666666666666660000000000000000000006666", "1212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212122222222212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212", "222222221111111122222200111111002222222211111111222222221111111122222200111111002222222201010101222222221111111122222222222222002222222233333333222222223333333322222222333333332222202211113Q2QQQ22202211113QQQ2222002211110QQQ2222222211111QQQ0022202211113QQ0", "CCCCCCCCCCCGGGGGJJJJJJNNSTKSSTKSNNNNNNNNDEGGGGGCNNNNNNNNNSTNNNNMMNNNOKLNNNNNNNNNNNONMNNNNNNNNNNCGGGGG00000GGGGGGB400BBBBBBOOOKL4BBBBBBBBBBOOOKL04444444444444000PPPPPPPPPPPPPPPPPPPPPPPPPPP000000000000000000000666666666666677776777666666666666000000000000000", "RR1RRRR1RR2111221112R1RRO11111RRRRRR1R1R1R1111R21111255552RR2211OOOOO12222RORR2RBBBBBBBBBBBBBBBBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA12AAAAB000000OOOOORRRRROORRRRORRORRORRRRRRRORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROORRORORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOOOOOOO", "O", "RRRRRRRROOOORRRRRRRRRRRRRRRRRRRROORRRRRRRKLRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRORRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOORRRRRRRRRRRRRRRRRR000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000000000000000000000000RRRRRRRRRRR000000000000000000000BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBBBBBBBBBBBBB", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRORRRRRRRRRORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOOO", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", "0RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRKLKLKLKLKLKLKLBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOKLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOKLKLKLKLKLOOOOOOOOOOOOOOOO", "R", "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOKLKLKLKLKLKLKLKLKLKLKLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOKLKLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOKLOO", "O", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOOOOOOOOOOOOOOOORROOOOOO000RRRRRRRRRR0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "1111111111111111111111111111111111111111111111102222222222222222222222222222222222222222222222201211122121212111121221222222441112121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212122RRRRRR12126661200000NNNNBNN", "2222222222222222222222222222222222222202000002005555555555555555555555555555555555555555555555555555555500000004N00000000000000655555555555555555555555000000000555555505555555055555550555555505555555055555550555555505555555066666666666666666666666666666666", "NNSTSTNNNSTNSTNNNNNNNNNJNNJNSTNNSTKLKLKLKLNNNNN4NNNNNNNNNNJJ00000000000000000000000000000000000000000000000000000000000000000000RRRRRRRRRRRRRRRRRRRRRRRRRR0RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR00000000000000000000000000RRRRRRRRRRRR0000", "CNNNR45AKLKLKLKLKLRRKLKLKLKLJKLLRAAAAAAAAA666688J44444RRAAA45NRR0555555555555555555555555555555555555555555555555555555555555555555555555555555555555550066QQ445J555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555N4445", "000005555555555555555555555555555555555555555500055555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555550RRBBBBRRRRRRRRRR55555555555555555555555555500000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000000000005555555555555555", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0BBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBRBBBBBBBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0", "R", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555550000000000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555000000000000000000000000000000000000000000000000000", "5555555555555555555554555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555", "5", "5", "5", "555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000000005555555555555555555555555555555555555555444444NN", "5", "5555555555554NNN555555555555555599999999995500000000000000000000121212121212121212121212121212121212121212121256777N6666666666N4121212121212121212121212000000065555555555555555555555555555555555555555555555555555555555555555555555AAAAAAAAAA66NNNNNN00000000", "QQQQQQQQQQQQQQQQQQQQQQQ444444444QQ1212121212121222121212121212121212121212121212121212121212121212121212121212124222222221212112121212124QQ121201212000000000000121212121210000000000000000000000000000000000000000000000000000000000000000000000000000044255555", "5565556555565555555555555555555555588668RRRR0000BBBBBBRRPR0000005555555555555555555555555555555555555555555555555555NNNN00000000885555555555555555555555555555555555555555555555555588888888888888886000000000NN9999999999000000666666666666666666555555NNN50000", "9999999999555555555555555555555555555566666666NN55555555555555555555555666666666668800000000000N5555555555555555555555555555500066685555555555555555555555555555555555555555555555568866668868888NNNNNNNNNNNNN0499999999990000NN00000000000000000000000000000000", "55555555555555555555555555555555555555555666666886688660000000005556555555556800999999999900NNNN55555555555555554555555RRR5800005555555555555555555555555555555555555555555555556566655665555566565000000000000000000000000554NN5555555555586688NN54486000000000", "0555555005555550055555500000000055555550555555500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005555555555555555555555555555555555588688688N86009999999999000000", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555500000000000055555555555555555555555000055555555555555555555555555555555555555555555555550000", "I", "I", "I", "I", "I", "I", "I", "I", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "H", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555500555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555500000000000000000000000000000000000000", "22222220000000000002222200000565555555555O5555555555555055555050550550555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555QQQQQQQQQQQQQQQQ00000000000000000555555555555555555555555555555555555555555555", "5", "55555555555555555555555555555555555555555555555555555555555555KL00000000000000005555555555555555555555555555555555555555555555555555555555555555005555555555555555555555555555555555555555555555555555550000000000000000000000000000000000000000555555555555PR00", "6666666666666666NNNNNNNKLN0000006666666000000000NJJMMKLKLKLKLKLKLKLKLNNKLNNNNMMMNNN0NNNNJKLKLKLNNNOJOOO0NPNN000055555055555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555500G", "0NNNPNNNKLNONJNN9999999999NNOOONN11111111111111111111111111KNLQMQ22222222222222222222222222KOLOKLNKLNN55555555554555555555555555555555555555555555555555555555445555555555555555555555555555555000555555005555550055555500555000PPOQRPP0ROOOORR0000000000GGGRR00", "5555555555550555555555555555555555555550555555555555555555505505555555555555550055555555555555000000000000000000000000000000000055555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555500000", "NNN0000BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB000RRRRRRRRRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBRRRRRRRRRRRRRRRRRB00000RRRRRRRRRRRR0000000000000000000000000000000000000000000000000000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR600", "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055555555555555555555555555555000555555555555555555555555555555555555555555555555500000000000000000000000000000000000000000000000", "55555555555555555555555555555550BBBB00000000000055555555555555555A55555555A000000000000000000000000000000000000000000000000000005555555555555555555555555555550N555555555555555555555555555555555555000055555555NAAAAA000000000000000000000000000000000000000000", "1111111111111111111111111111111111111111222222222222222222222222222222222222222255555555555555555555555555555555555555555555555555555555555555555555555555555500999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "555555005055555555555555555555555555555555555555555555055000500555555555555555555555550NBBBBBBBB0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "5555555555555555555555BBBBBB000N5555555555555555555555555500000N000000000000000000000000000000000000000000000000000000000000000055555555555555555555555555555555555555555555555555555555000000550000000000000000000000000000000000000000000000000000000000000000", "5666066000006666555505550555555555555555555555555555000066600006BBBBBBBB00000000NNNNNNNNN000000055555555555555555555555555555BBN00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "555555555555555555555555555555555555555555555555555555000NNNNNNN555555555555555555555500BBBBBBBB555555555555555555500000BBBBBBBB00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "5555555555555555555555555555555555555555555555555555555555555555555555555000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "86855555555555555555555555555555555555555555555555555555666666666666666NNNNNNN0000BBBBBBBBBBBBBBBBBBBB9999999999000000000000000066855555555555555555555555555555555555555555555588866668866NNGNNNN00000000000000555555555555555555555555500000009999999999000000", "6665555555555555555555555555555555555556666686666666609999999999NNNN000000000000000000000000000000000000000000000000000000000000668555555555555555555555555555555555555555555555555888666666666885555NNNN0000000999999999900000000000000000000000000000000000000", "0", "0", "0", "0", "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055555555555555555555555555555555555555555556868866666686000000009999999999000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "5", "5", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0000000000000NNNN00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "5", "5", "5", "5", "5555555555555555555555555555555555555555555555500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "5", "5", "5555555555555555555555555555555555555555555555555555555550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "5555555555555555555555555555555555555555555555555555555555555555555550000000000058888888888888888888888888888888888888888888888000000000000000066664444444444444000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "5500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR00RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR88666RRR888888GGGGGGGG66666666RR6666666RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR6666RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000000000000000000000000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR666R000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR000000000BBBBBBBBBBBBBBBBBB0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "1111111111111111111111111122222222222222222222222222111111111111111111111111112222222022222222222222222211111111111111111111111111222222222222222222222222221011001001100111101111111122220202222222022222222222111111111111111111111111112222222222222222222222", "2222110111100111111110111111102222222222222222222222222211011110111110100011111110222222222222222222222222221111111111111111111111111122222222222222222222222222111111111111111111111111112222222222222222222222222211111111111111111111111111222222222222222222", "2222222211111111111111111111111111222222222222222222222222221111111111111111111111111122222222222222222222222222111111111111111111111111112222222222222222222222222222001111111111111111111111111O2222222222222222222222222O2222221111111111111111111111111O2222", "222222222222222222222O2222221111111111111111111111111O2222222222222222222222222O2222221111111111111111111111111O2222222222222222222222222O2222221111111111111111111111111O2222222222222222222222222O222222120099999999999999999999999999999999999999999999999999", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "555505555555555555555555555555550550500505555555555055550505000000500005050505550550500505050505055050055550555555505555055550505555555555055555555555555555000005550555550555555555555555550000000000000000000000000000000000000000000000000000OO00000000000000", "0", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR000000000000RRRRRRRRRRRRRRR00RRRRRRRRRRRRRR00RRRRRRRRRRRRRRR0RRRRRRRRRRRRRRR00000000000000000000000000000000", "BBBBBBBBBBB00000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR000000000000000000000000000000000000000000000000000000000000000000000000000RRRRRRRRRRRRRRRRRRRRRRRRRR", "RRR0000000000000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR00000RRRRRRRRR0000000RR000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR000000000000000RRRRRR0RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR000RRRRRRRRRRRRRRRRRRRR000000000000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0RRRRR000000000000000000000RRRRRRRRRRRRRRRRR000000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0R0RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0RRRR000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR00RRRR000000000000RRRRRRRRRRRRRRRRRRRRRRRR000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000RRRRR", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000RRRRRRRRRRR000000000000000000000000000000000000000000000000RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR0000000000000000000000000000000000000000000000000000000000", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555500000000000000000000000000000000000000000", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5555555555555555555555555555555555555555555555555555500000000000555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555", "5555555555555555555555555555550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "5", "5", "5555555555555555555555555555550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "0", "0", "0", "0", "0"];
	var planeE_type_map = ["0G000000000000000000000000000000GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "6666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666660000000000000000", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];

	function c2t(n) {
		return types[compressedType.indexOf(n)];
	}

	function g(c) {
		var ch = c.charCodeAt(0);
		switch (ch >> 16) {
			case 0:
			case 1:
			case 2:
				{
					var pageMap = plane0to2_type_map[ch >> 8];
					if (pageMap.length == 1) {
						return pageMap;
					}
					return pageMap[ch & 0xFF];
				}
			case 14:
				{
					var pageMap = planeE_type_map[(ch >> 8) & 0xFF];
					if (pageMap.length == 1) {
						return pageMap;
					}
					return pageMap[ch & 0xFF];
				}
			case 15:
			case 16: // Private Use Planes
				return (ch & 0xFFFE) == 0xFFFE ? "0" : "H";
			default:
				return "0";
		}
	}

	return function(c) {
		return c2t(g(c));
	}
}();
},{"../compiler":1}],6:[function(require,module,exports){
'use strict';

var NorlitJSCompiler = require("../compiler");
require("./lex");

NorlitJSCompiler.Parser = function() {
	function Grammar(lex, context) {
		this.lex = lex;
		this.context = context;
		this.buffer = [];
		this.strictMode = false;
	}

	function Node(type) {
		this.type = type;
	}

	var ASTBuilder = {
		wrapConstant: function(constant) {
			var ret = new Node("Constant");
			ret.value = constant;
			ret.sideEffect = false;
			return ret;
		}
	};

	NorlitJSCompiler.Node = Node;
	NorlitJSCompiler.ASTBuilder = ASTBuilder;


	Node.ILLEGAL = new Node('<illegal>');
	Node.EMPTY = new Node('EmptyStatement');
	Node.EMPTY.sideEffect = false;

	Node.prototype.push = function(obj) {
		this[this.length++] = obj;
	}

	Grammar.prototype._getErrorPosition = function(token) {
		if (!token) {
			token = this.lookahead();
		}
		return {
			startOffset: token.startPtr,
			endOffset: token.endPtr
		};
	}

	Grammar.prototype.throwErrorOnToken = function(token, error) {
		if (!token) {
			token = this.lookahead();
		}
		var error = new SyntaxError(error);
		error.detail = this._getErrorPosition(token);
		if (token.type == 'eof') {
			throw error;
		}
		this.context.throwError(error);
	}

	Grammar.prototype.throwWarningOnToken = function(token, error) {
		if (!token) {
			token = this.lookahead();
		}
		var error = new NorlitJSCompiler.Warning(error);
		error.detail = {
			startOffset: token.startPtr,
			endOffset: token.endPtr
		};
		this.context.throwWarning(error);
	}

	Grammar.prototype._throwStrictOnToken = function(token, error) {
		if (this.strictMode) {
			this.throwErrorOnToken(token, error + " is not allowed in strict mode");
		} else {
			this.throwWarningOnToken(token, error + " is discouraged and will not work if in strict mode");
		}
	}

	Grammar.prototype.next = function() {
		if (this.buffer.length) {
			var ret = this.buffer.shift();
		} else {
			var ret = this.lex.nextToken();
		}
		if (ret.noStrict) {
			this._throwStrictOnToken(ret, ret.noStrict);
		}
		return ret;
	}

	Grammar.prototype.lookahead = function() {
		if (this.buffer.length) {
			return this.buffer[0];
		}
		var t = this.lex.nextToken();
		this.buffer.push(t);
		return t;
	}

	Grammar.prototype.lookahead2 = function() {
		switch (this.buffer.length) {
			case 0:
				{
					this.buffer.push(this.lex.nextToken());
					var t = this.lex.nextToken();
					this.buffer.push(t);
					return t;
				}
			case 1:
				{
					var t = this.lex.nextToken();
					this.buffer.push(t);
					return t;
				}
			default:
				return this.buffer[1];
		}
	}

	Grammar.prototype.expect = function(id, errmsg) {
		if (this.lookahead().type == id) {
			return this.next();
		}
		this.throwErrorOnToken(null, errmsg);
		this.next();
		return NorlitJSCompiler.Token.ILLEGAL;
	}

	Grammar.prototype.expectSemicolon = function() {
		var nxt = this.lookahead();
		if (nxt.type == ';') {
			this.next();
			return;
		}
		if (nxt.type == '}' || nxt.lineBefore) {
			return;
		} else {
			this.throwErrorOnToken(null, "Expected semicolon after statement");
		}
	}

	Grammar.prototype.primaryExpr = function() {
		switch (this.lookahead().type) {
			case 'this':
				{
					this.next();
					return new Node("ThisExpression");
				}
			case 'id':
				{
					var ret = new Node("Identifier");
					ret.name = this.next().value;
					return ret;
				}
			case 'null':
				{
					this.next();
					return ASTBuilder.wrapConstant(null);
				}
			case 'true':
				{
					this.next();
					return ASTBuilder.wrapConstant(true);
				}
			case 'false':
				{
					this.next();
					return ASTBuilder.wrapConstant(false);
				}
			case 'num':
				{
					return ASTBuilder.wrapConstant(this.next().value);
				}
			case 'str':
				{
					return ASTBuilder.wrapConstant(this.next().value);
				}
			case '/':
			case '/=':
				{
					var token = this.lex.nextRegexp(this.next());
					var ret = new Node("RegexpLiteral");
					ret.regexp = token.regexp;
					ret.flags = token.flags;
					return ret;
				}
			case '(':
				{
					this.next();
					var expr = this.expression();
					this.expect(')', 'Parenthesis mismatch in expression');
					return expr;
				}
			case '[':
				{
					return this.arrayLiteral();
				}
			case '{':
				{
					return this.objectLiteral();
				}
			default:
				{
					this.throwErrorOnToken(null, 'Expected expression');
					this.next();
					return Node.ILLEGAL;
				}
		}
	}

	Grammar.prototype.arrayLiteral = function() {
		this.next();
		if (this.lookahead().type == ']') {
			this.next();
			var ret = new Node('ArrayInitializer');
			ret.elements = [];
			return ret;
		}
		var ret = new Node('ArrayInitializer');
		ret.elements = [this.arrayElem()];
		while (true) {
			var lh = this.next();
			if (lh.type == ']') {
				return ret;
			} else if (lh.type != ',') {
				this.throwErrorOnToken(null, 'Expected comma or right bracket in array initializer expression');
			}
			if (this.lookahead().type == ']') {
				this.next();
				return ret;
			}
			ret.elements.push(this.arrayElem());
		}
	}

	Grammar.prototype.arrayElem = function() {
		if (this.lookahead().type == ',') {
			return undefined;
		}
		return this.assignExpr();
	}

	Grammar.prototype.objectLiteral = function() {
		this.next();
		this.lex.parseId = false;
		var tk = this.lookahead();
		this.lex.parseId = true;
		if (tk.type == '}') {
			this.next();
			var ret = new Node('ObjectInitializer');
			ret.elements = [];
			return ret;
		}
		var ret = new Node('ObjectInitializer');
		ret.elements = [this.objectLiteralProp()];
		while (true) {
			var lh = this.next();
			if (lh.type == '}') {
				return ret;
			} else if (lh.type != ',') {
				this.throwErrorOnToken(null, 'Expected comma or right brace in object initializer expression');
			}
			this.lex.parseId = false;
			var lhd = this.lookahead();
			this.lex.parseId = true;
			if (lhd.type == '}') {
				this.next();
				return ret;
			}
			var prop = this.objectLiteralProp();
			outer: for (var i = 0; i < ret.elements.length; i++) {
				var ele = ret.elements[i];
				if (ele.key != prop.key) continue;
				switch (prop.type) {
					case 'Property':
						{
							if (ele.type == 'Property') {
								this._throwStrictOnToken(null, 'Defining duplicated data properties in object initializer expression');
							} else {
								this.throwErrorOnToken(null, 'Data property and accessor property with the same name cannot be defined at the same time');
							}
							break;
						}
					case 'Setter':
						{
							if (ele.type == 'Property') {
								this.throwErrorOnToken(null, 'Data property and accessor property with the same name cannot be defined at the same time');
							} else if (ele.type == 'Setter') {
								this.throwErrorOnToken(null, 'Two setters with the same name cannot be defined at the same time');
							}
							break;
						}
					default:
						{
							if (ele.type == 'Property') {
								this.throwErrorOnToken(null, 'Data property and accessor property with the same name cannot be defined at the same time');
							} else if (ele.type == 'Getter') {
								this.throwErrorOnToken(null, 'Two getters with the same name cannot be defined at the same time');
							}
							break;
						}
				}
				break;
			}
			ret.elements.push(prop);
		}
	}

	Grammar.prototype.objectLiteralProp = function() {
		this.lex.parseId = false;
		var name = this.next();
		if (name.type != 'str' && name.type != 'num' && name.type != 'id') {
			this.throwErrorOnToken(name, 'Expected identifier, string or number in object initializer');
			return Node.ILLEGAL;
		}
		var colon = this.next();
		this.lex.parseId = true;
		if (colon.type == ':') {
			if (name.type == 'num') {
				name = String(name.value);
			} else {
				name = name.value;
			}
			var ret = new Node('Property');
			ret.key = name;
			ret.value = this.assignExpr();
			return ret;
		} else {
			if (name.type != 'id' || (name.value != 'get' && name.value != 'set')) {
				this.throwErrorOnToken(colon, 'Expected colon after identifier in object initializer');
				return Node.ILLEGAL;
			}
			if (name.value == 'get') {
				var ret = new Node('Getter');
				ret.key = colon.value;
				this.expect('(', 'Expected left parenthesis in object getter initializer');
				this.expect(')', 'Object getter initializer cannot have parameters');
				this.expect('{', "Expected left brace in object getter declaration");
				ret.body = this.funcBody();
				this.expect('}', "Brace mismatch in object getter declaration");
				return ret;
			} else {
				var ret = new Node('Setter');
				ret.key = colon.value;
				this.expect('(', 'Expected left parenthesis in object setter initializer');
				ret.parameter = this.expect('id', 'Object setter initializer need to have exactly one parameter').value;
				if (ret.parameter == 'eval' || ret.parameter == 'arguments') {
					this._throwStrictOnToken(null, "Overriding eval or arguments");
				}
				this.expect(')', 'Object setter initializer need to have exactly one parameter');
				this.expect('{', "Expected left brace in object setter declaration");
				ret.body = this.funcBody();
				this.expect('}', "Brace mismatch in object setter declaration");
				return ret;
			}
		}
	}

	Grammar.prototype.memberExpr = function() {
		var cur;
		switch (this.lookahead().type) {
			case 'function':
				{
					return this.funcExpr();
				}
			case 'new':
				{
					this.next();
					var expr = this.memberExpr();
					if (this.lookahead().type == '(') {
						var args = this.arguments();
					} else {
						var args = [];
					}
					var ret = new Node('NewExpression');
					ret.constructor = expr;
					ret.arguments = args;
					cur = ret;
					break;
				}
			default:
				cur = this.primaryExpr();
				break;
		}
		while (true) {
			switch (this.lookahead().type) {
				case '.':
					{
						this.next();
						this.lex.parseId = false;
						var id = this.expect('id', 'Expected identifier in member accessing expression');
						this.lex.parseId = true;
						var node = new Node('MemberExpression');
						node.base = cur;
						node.property = ASTBuilder.wrapConstant(id.value);
						cur = node;
						break;
					}
				case '[':
					{
						this.next();
						var expr = this.expression();
						this.expect(']', 'Bracket mismatch in member accessing expression');
						var node = new Node('MemberExpression');
						node.base = cur;
						node.property = expr;
						cur = node;
						break;
					}
				default:
					return cur;
			}
		}
	}

	Grammar.prototype.leftHandExpr = function() {
		var cur = this.memberExpr();
		while (true) {
			switch (this.lookahead().type) {
				case '.':
					{
						this.next();
						this.lex.parseId = false;
						var id = this.expect('id', 'Expected identifier in member accessing expression');
						this.lex.parseId = true;
						id.type = 'str';
						var node = new Node('MemberExpression');
						node.base = cur;
						node.property = ASTBuilder.wrapConstant(id.value);
						cur = node;
						break;
					}
				case '[':
					{
						this.next();
						var expr = this.expression();
						this.expect(']', 'Bracket mismatch in member accessing expression');
						var node = new Node('MemberExpression');
						node.base = cur;
						node.property = expr;
						cur = node;
						break;
					}
				case '(':
					{
						var node = new Node('CallExpression');
						node.callee = cur;
						node.arguments = this.arguments();
						cur = node;
						break;
					}
				default:
					return cur;
			}
		}
	}

	Grammar.prototype.arguments = function() {
		this.next();
		if (this.lookahead().type == ')') {
			this.next();
			return [];
		}
		var ret = [this.assignExpr()];
		while (true) {
			if (this.lookahead().type != ',') {
				this.expect(')', 'Parenthesis mismatch in call or new expression');
				return ret;
			}
			this.next();
			ret.push(this.assignExpr());
		}
	}

	Grammar.prototype.postfixExpr = function() {
		var expr = this.leftHandExpr();
		var nxt = this.lookahead();
		if (nxt.lineBefore || (nxt.type != '++' && nxt.type != '--')) {
			return expr;
		}
		if (expr.type == 'Identifier' && (expr.name == 'eval' || expr.name == 'arguments')) {
			this._throwStrictOnToken(null, "Overriding eval or arguments");
		}
		this.next();
		var ret = new Node('PostfixExpression');
		ret.operator = nxt.type;
		ret.operand = expr;
		return ret;
	}

	Grammar.prototype.unaryExpr = function() {
		switch (this.lookahead().type) {
			case '+':
			case '-':
			case 'delete':
			case 'void':
			case 'typeof':
			case '++':
			case '--':
			case '!':
			case '~':
				break;
			default:
				return this.postfixExpr();
		}
		var node = new Node('UnaryExpression');
		node.operator = this.next().type;
		node.operand = this.unaryExpr();
		if (node.operator == 'delete' && node.operand.type == 'Identifier') {
			this._throwStrictOnToken(null, 'Deleting a unqualified identifier');
		} else if ((node.operator == '++' || node.operator == '--') && node.operand.type == 'Identifier' && (node.operand.name == 'eval' || node.operand.name == 'arguments')) {
			this._throwStrictOnToken(null, "Overriding eval or arguments");
		}
		return node;
	}

	function binaryGen(ops, previous) {
		if (typeof(ops) == "string") {
			return function() {
				var cur = this[previous]();
				while (true) {
					if (this.lookahead().type != ops) {
						return cur;
					}
					var node = new Node("BinaryExpression");
					node.operator = this.next().type;
					node.left = cur;
					node.right = this[previous]();
					cur = node;
				}
			}
		} else {
			return function() {
				var cur = this[previous]();
				while (true) {
					var type = this.lookahead().type;
					if (ops.indexOf(type) == -1) {
						return cur;
					}
					var node = new Node("BinaryExpression");
					node.operator = this.next().type;
					node.left = cur;
					node.right = this[previous]();
					cur = node;
				}
			}
		}
	}

	Grammar.prototype.mulExpr = binaryGen(['*', '%', '/'], "unaryExpr");
	Grammar.prototype.addExpr = binaryGen(['+', '-'], "mulExpr");
	Grammar.prototype.shiftExpr = binaryGen(['<<', '>>', '>>>'], "addExpr");
	Grammar.prototype.relExpr = binaryGen(['<', '>', '<=', '>=', 'instanceof', 'in'], "shiftExpr");
	Grammar.prototype.relExprNoIn = binaryGen(['<', '>', '<=', '>=', 'instanceof'], "shiftExpr");
	Grammar.prototype.eqExpr = binaryGen(['==', '!=', '===', '!=='], "relExpr");
	Grammar.prototype.eqExprNoIn = binaryGen(['==', '!=', '===', '!=='], "relExprNoIn");
	Grammar.prototype.andExpr = binaryGen('&', "eqExpr");
	Grammar.prototype.andExprNoIn = binaryGen('&', "eqExprNoIn");
	Grammar.prototype.xorExpr = binaryGen('^', "andExpr");
	Grammar.prototype.xorExprNoIn = binaryGen('^', "andExprNoIn");
	Grammar.prototype.orExpr = binaryGen('|', "xorExpr");
	Grammar.prototype.orExprNoIn = binaryGen('|', "xorExprNoIn");
	Grammar.prototype.lAndExpr = binaryGen('&&', "orExpr");
	Grammar.prototype.lAndExprNoIn = binaryGen('&&', "orExprNoIn");
	Grammar.prototype.lOrExpr = binaryGen('||', "lAndExpr");
	Grammar.prototype.lOrExprNoIn = binaryGen('||', "lAndExprNoIn");

	Grammar.prototype.condExpr = function(noIn) {
		var node = noIn ? this.lOrExprNoIn() : this.lOrExpr();
		if (this.lookahead().type == '?') {
			var ret = new Node('ConditionalExpression');
			this.next();
			ret.test = node;
			ret.true = this.assignExpr();
			this.expect(':', 'Expected colon in conditional expression');
			ret.false = this.assignExpr(noIn);
			return ret;
		} else {
			return node;
		}
	}

	Grammar.prototype.assignExpr = function(noIn) {
		var node = this.condExpr(noIn);
		switch (this.lookahead().type) {
			case '=':
			case '*=':
			case '/=':
			case '%=':
			case '+=':
			case '-=':
			case '<<=':
			case '>>=':
			case '>>>=':
			case '&=':
			case '|=':
			case '^=':
				break;
			default:
				return node;
		}
		if (node.type == 'Identifier' && (node.name == 'eval' || node.name == 'arguments')) {
			this.throwErrorOnToken(null, "Overriding eval or arguments");
		}
		var ret = new Node('AssignmentExpression');
		ret.operator = this.next().type;
		ret.left = node;
		ret.right = this.assignExpr(noIn);
		return ret;
	}
	Grammar.prototype.assignExprNoIn = function() {
		return this.assignExpr(true);
	}

	Grammar.prototype.expression = binaryGen(',', 'assignExpr');
	Grammar.prototype.expressionNoIn = binaryGen(',', 'assignExprNoIn');

	Grammar.prototype.statement = function() {
		switch (this.lookahead().type) {
			case '{':
				return this.block();
			case 'var':
				return this.varStmt();
			case ';':
				this.next();
				return new Node('EmptyStatement');
			case 'if':
				return this.ifStmt();
			case 'do':
				return this.doStmt();
			case 'while':
				return this.whileStmt();
			case 'for':
				return this.forStmt();
			case 'continue':
				return this.continueStmt();
			case 'break':
				return this.breakStmt();
			case 'return':
				return this.returnStmt();
			case 'with':
				this._throwStrictOnToken(null, 'With statement');
				return this.withStmt();
			case 'switch':
				return this.switchStmt();
			case 'throw':
				return this.throwStmt();
			case 'try':
				return this.tryStmt();
			case 'debugger':
				{
					this.next();
					this.expectSemicolon();
					return new Node('DebuggerStatement');
				}
			case 'id':
				{
					if (this.lookahead2().type == ':') {
						return this.labelStmt();
					}
				}
			default:
				return this.exprStmt();
		}
	}

	Grammar.prototype.block = function() {
		this.expect('{', 'Expected left brace in block statement');
		if (this.lookahead().type == '}') {
			this.next();
			var block = new Node('BlockStatement');
			block.body = [];
			return block;
		}
		var block = new Node('BlockStatement');
		block.body = [this.statement()];
		while (true) {
			if (this.lookahead().type == '}') {
				this.next();
				return block;
			}
			block.body.push(this.statement());
		}
	}

	Grammar.prototype.varStmt = function() {
		this.next();
		var ret = this.varDeclList();
		this.expectSemicolon();
		return ret;
	}

	Grammar.prototype.varDeclList = function() {
		var varDecl = new Node('VariableDeclaration');
		varDecl.declarations = [];
		do {
			var ret = new Node('VariableDeclarator');
			ret.name = this.expect('id', 'Expected identifier in variable declaration').value;
			if (ret.name == 'eval' || ret.name == 'arguments') {
				this._throwStrictOnToken(null, "Overriding eval or arguments");
			}
			if (this.lookahead().type == '=') {
				this.next();
				ret.init = this.assignExpr();
			} else {
				ret.init = undefined;
			}
			varDecl.declarations.push(ret);
			if (this.lookahead().type != ',') return varDecl;
			this.next();
		} while (true);
	}

	Grammar.prototype.exprStmt = function() {
		var expr = this.expression();
		this.expectSemicolon();
		var ret = new Node('ExpressionStatement');
		ret.expression = expr;
		return ret;
	}

	Grammar.prototype.ifStmt = function() {
		this.next();
		var ret = new Node('IfStatement');
		this.expect('(', 'Expected left parenthesis after if');
		ret.test = this.expression();
		this.expect(')', 'Parenthesis mismatch in if statement');
		ret.true = this.statement();
		if (this.lookahead().type == 'else') {
			this.next();
			ret.false = this.statement();
		} else {
			ret.false = undefined;
		}
		return ret;
	}

	Grammar.prototype.doStmt = function() {
		this.next();
		var ret = new Node('DoStatement');
		ret.body = this.statement();
		this.expect('while', 'Expected keyword while in do while statement');
		this.expect('(', 'Expected left parenthesis in do while statement');
		ret.test = this.expression();
		this.expect(')', 'Parenthesis mismatch in do while statement');
		this.expectSemicolon();
		return ret;
	}

	Grammar.prototype.whileStmt = function() {
		this.next();
		var ret = new Node('WhileStatement');
		this.expect('(', 'Expected left parenthesis after while');
		ret.test = this.expression();
		this.expect(')', 'Parenthesis mismatch in while statement');
		ret.body = this.statement();
		return ret;
	}

	Grammar.prototype.forStmt = function() {
		this.next();
		this.expect('(', 'Expected left parenthesis after for');
		if (this.lookahead().type == 'var') {
			var isVar = true;
			this.next();
			var initExpr = this.varDeclList();
		} else {
			var isVar = false;
			if (this.lookahead().type != ';') {
				var initExpr = this.expressionNoIn();
			} else {
				var initExpr = undefined;
			}
		}
		if (this.lookahead().type == 'in') {
			this.next();
			if (initExpr.type == 'VariableDeclaration') {
				if (initExpr.declarations.length != 1) {
					this.throwErrorOnToken(null, "Too many variable declarations for a for-in statement");
				}
				initExpr = initExpr.declarations[0];
			}
			var ret = new Node('ForInStatement');
			ret.var = initExpr;
			ret.container = this.expression();
			this.expect(')', 'Parenthesis mismatch in for-in statement');
			ret.body = this.statement();
			return ret;
		} else {
			this.expect(';', "Expected semicolon in for statement");
			if (this.lookahead().type != ';') {
				var testExpr = this.expression();
			} else {
				var testExpr = undefined;
			}
			this.expect(';', "Expected semicolon in for statement");
			if (this.lookahead().type != ')') {
				var incExpr = this.expression();
			} else {
				var incExpr = undefined;
			}
			this.expect(')', "Parenthesis mismatch in for statement");
			var ret = new Node('ForStatement');
			ret.init = initExpr;
			ret.test = testExpr;
			ret.inc = incExpr;
			ret.body = this.statement();
			return ret;
		}
	}

	Grammar.prototype.withStmt = function() {
		this.next();
		var ret = new Node('WithStatement');
		this.expect('(', "Expected left parenthesis after with");
		ret.base = this.expression();
		this.expect(')', "Parenthesis mismatch in with statement");
		ret.body = this.statement();
		return ret;
	}

	Grammar.prototype.switchStmt = function() {
		this.next();
		var ret = new Node('SwitchStatement');
		this.expect('(', "Expected left parenthesis after switch");
		ret.expression = this.expression();
		this.expect(')', "Parenthesis mismatch in switch statement");
		ret.body = this.caseBlock();
		return ret;
	}

	Grammar.prototype.caseBlock = function() {
		this.expect('{', "Expected left brace in case block");
		var list = [];
		var def = false;
		while (true) {
			var lhd = this.next();
			if (lhd.type == 'case') {
				var key = this.expression();
			} else if (lhd.type == 'default') {
				if (def) {
					this.throwErrorOnToken(null, "Only one default clause is permitted in switch statement");
				}
				def = true;
				var key = undefined;
			} else if (lhd.type == '}') {
				return list;
			} else {
				if (lastError != list.length) {
					this.throwErrorOnToken(lhd, "Expected case clause or default clause");
					var lastError = list.length;
				} else {
					this.context.lastError().detail.endOffset = this._getErrorPosition(lhd).endOffset;
				}
				continue;
			}
			this.expect(':', 'Expected colon in case clause');
			var stmt = [];
			while (true) {
				lhd = this.lookahead();
				if (lhd.type != 'case' && lhd.type != 'default' && lhd.type != '}') {
					stmt.push(this.statement());
				} else {
					break;
				}
			}
			var clause = new Node('CaseClause');
			clause.key = key;
			clause.body = stmt;
			list.push(clause);
		}
	}

	Grammar.prototype.returnStmt = function() {
		this.next();
		var lhd = this.lookahead();
		if (lhd.type == ';') {
			this.next();
			var ret = new Node('ReturnStatement');
			ret.expression = undefined;
			return ret;
		} else if (lhd.type == '}' || lhd.lineBefore) {
			var ret = new Node('ReturnStatement');
			ret.expression = undefined;
			return ret;
		}
		var ret = new Node('ReturnStatement');
		ret.expression = this.expression();
		this.expectSemicolon();
		return ret;
	}

	Grammar.prototype.continueStmt = function() {
		this.next();
		var lhd = this.lookahead();
		if (lhd.type == 'id' && !lhd.lineBefore) {
			var ret = new Node('ContinueStatement');
			ret.label = this.next().value;
			this.expectSemicolon();
			return ret;
		}
		var ret = new Node('ContinueStatement');
		ret.label = undefined;
		this.expectSemicolon();
		return ret;
	}

	Grammar.prototype.breakStmt = function() {
		this.next();
		var lhd = this.lookahead();
		if (lhd.type == 'id' && !lhd.lineBefore) {
			var ret = new Node('BreakStatement');
			ret.label = this.next().value;
			this.expectSemicolon();
			return ret;
		}
		var ret = new Node('BreakStatement');
		ret.label = undefined;
		this.expectSemicolon();
		return ret;
	}

	Grammar.prototype.labelStmt = function() {
		var ret = new Node('LabeledStatement');
		ret.label = this.next().value;
		this.next();
		ret.body = this.statement();
		return ret;
	}

	Grammar.prototype.throwStmt = function() {
		this.next();
		var ret = new Node('ThrowStatement');
		if (this.lookahead().lineBefore) {
			this.throwErrorOnToken(null, "Expected Expression in throw statement");
			ret.expression = Node.ILLEGAL;
			return ret;
		}
		ret.expression = this.expression();
		this.expectSemicolon();
		return ret;
	}

	Grammar.prototype.tryStmt = function() {
		this.next();
		var ret = new Node('TryStatement');
		ret.body = this.block();
		if (this.lookahead().type == 'finally') {
			this.next();
			ret.parameter = ret.catch = undefined;
			ret.finally = this.block();
			return ret;
		}
		this.expect('catch', "Expected catch or finally after try block");
		this.expect('(', "Expected left parenthesis in catch block");
		ret.parameter = this.expect('id', "Expected identifier in catch block").value;
		if (ret.parameter == 'eval' || ret.parameter == 'arguments') {
			this._throwStrictOnToken(null, "Overriding eval or arguments");
		}
		this.expect(')', "Parenthesis mismatch in catch block");
		ret.catch = this.block();
		if (this.lookahead().type == 'finally') {
			this.next();
			ret.finally = this.block();
		} else {
			ret.finally = undefined;
		}
		return ret;
	}

	Grammar.prototype.funcDecl = function() {
		var func = this.funcExpr();
		if (!func.name) {
			this.throwErrorOnToken(null, "Expected function name in function declaration");
		}
		func.type = 'FunctionDeclaration';
		return func;
	}

	Grammar.prototype.funcExpr = function() {
		this.next();
		var func = new Node('FunctionExpression');
		if (this.lookahead().type == 'id') {
			func.name = this.next().value;
			if (func.name == 'eval' || func.name == 'arguments') {
				this._throwStrictOnToken(null, "Overriding eval or arguments");
			}
		} else {
			func.name = undefined;
		}
		this.expect('(', "Expected left parenthesis or function name in function expression");
		if (this.lookahead().type == 'id') {
			func.parameter = this.formalParamList();
		} else {
			func.parameter = [];
		}
		this.expect(')', "Parenthesis mismatch in function declaration");
		this.expect('{', "Expected left brace in function declaration");
		func.body = this.funcBody();
		this.expect('}', "Brace mismatch in function declaration");
		return func;
	}

	Grammar.prototype.formalParamList = function() {
		var ret = [];
		do {
			var name = this.expect('id', "Expected identifier in function parameter list").value;
			if (name == 'eval' || name == 'arguments') {
				this._throwStrictOnToken(null, "Overriding eval or arguments");
			} else if (ret.indexOf(name) != -1) {
				this._throwStrictOnToken(null, 'Using duplicate parameter names');
			}
			ret.push(name);
			if (this.lookahead().type != ',') {
				return ret;
			}
			this.next();
		} while (true);
	}

	Grammar.prototype.funcBody = function() {
		var body = [];
		var originalStrict = this.strictMode;
		while (true) {
			var next = this.lookahead();
			if (next.type != 'str') {
				break;
			}
			var nextToken = this.lookahead2();
			if (nextToken.type != ';') {
				var stmt = this.exprStmt();
				if (this.lookahead() != nextToken) {
					body.push(stmt);
					break;
				}
			} else {
				this.next();
				this.next();
			}
			var raw = this.lex.getRaw(next);
			if (raw.substr(1, raw.length - 2) == 'use strict') {
				this.strictMode = true;
			}
			var dir = new Node('DirectiveStatement');
			dir.value = next.value;
			dir.raw = raw;
			body.push(dir);
		}
		while (true) {
			var next = this.lookahead();
			if (next.type == 'eof' || next.type == '}') {
				this.strictMode = originalStrict;
				return body;
			}
			var stmt = this.sourceElement();
			body.push(stmt);
		}
	}

	Grammar.prototype.sourceElement = function() {
		if (this.lookahead().type == 'function') {
			return this.funcDecl();
		} else {
			return this.statement();
		}
	}

	Grammar.prototype.program = function() {
		var program = new Node('Program');
		program.body = this.funcBody();
		this.expect('eof', 'Unexpected right brace at end of program');
		return program;
	}

	return function(lex, context) {
		if (!(lex instanceof NorlitJSCompiler.Lex)) {
			lex = new NorlitJSCompiler.Lex(lex, context);
		}
		var g = new Grammar(lex, context);
		try {
			var ret = g.program();
		} catch (e) {
			context.throwError(e);
		}
		return ret;
	}
}();
},{"../compiler":1,"./lex":7}],7:[function(require,module,exports){
'use strict';

var NorlitJSCompiler = require("../compiler");
require("./chartype");

NorlitJSCompiler.Lex = function() {
	var type = NorlitJSCompiler.CharType;

	var TAB = "\u0009",
		VT = "\u000B",
		FF = "\u000C",
		SP = "\u0020",
		NBSP = "\u00A0",
		BOM = "\uFEFF",
		LF = "\u000A",
		CR = "\u000D",
		LS = "\u2028",
		PS = "\u2029",
		ZWNJ = "\u200C",
		ZWJ = "\u200D";

	var strictReserved = {
		implements: true,
		interface: true,
		let: true,
		package: true,
		private: true,
		protected: true,
		public: true,
		static: true,
		yield: true
	};

	var reserved = {
		class: true,
		const: true,
		enum: true,
		export: true,
		extends: true,
		import: true,
		super: true
	};

	var keywords = {
		break: true,
		case: true,
		catch: true,
		continue: true,
		debugger: true,
		default: true,
		delete: true,
		do: true,
		else: true,
		finally: true,
		for: true,
		function: true,
		if: true,
		in : true,
		instanceof: true,
		new: true,
		return: true,
		switch: true,
		this: true,
		throw: true,
		try: true,
		typeof: true,
		var: true,
		void: true,
		while: true,
		with: true,
		null: true,
		true: true,
		false: true
	};

	function Lex(str, context) {
		this.source = str;
		this.context = context;
		this.ptr = 0;
		this.line = 1;
		this.lineBefore = false;
		this.parseId = true;
	}

	NorlitJSCompiler.Token = Token;
	Token.ILLEGAL = new Token('<illegal>');
	Token.ILLEGAL.value = Token.ILLEGAL;

	function subChar(a, b) {
		return a.charCodeAt(0) - b.charCodeAt(0);
	}

	function char(a) {
		return String.fromCharCode(a);
	}

	function assert(bool) {
		if (!bool) {
			throw new Error('Assertion Error');
		}
	}

	function Token(type) {
		this.type = type;
	}

	function assertNext(lex, allowed) {
		var nxt = nextChar(lex);
		assert(allowed.indexOf(nxt) != -1);
		return nxt;
	};

	function lookahead(lex) {
		if (lex.ptr >= lex.source.length) {
			return '\uFFFF';
		}
		return lex.source[lex.ptr];
	}

	function nextChar(lex) {
		if (lex.ptr >= lex.source.length) {
			lex.ptr++;
			return '\uFFFF';
		}
		return lex.source[lex.ptr++];
	}

	function pushback(lex, num) {
		lex.ptr -= num || 1;
	}

	Lex.prototype.throwError = function(msg) {
		var err = new SyntaxError(msg);
		err.detail = {
			startOffset: this.startPtr,
			endOffset: this.ptr
		};
		this.context.throwError(err);
	}

	/* Character type classification */
	Lex.prototype.isHexDigit = function(digit) {
		return "0123456789abcdefABCDEF".indexOf(digit) != -1;
	}

	Lex.prototype.isIdentfierStart = function(char) {
		if (char == '$' || char == '_') {
			return true;
		}
		switch (type(char)) {
			case 'UPPERCASE_LETTER':
			case 'LOWERCASE_LETTER':
			case 'TITLECASE_LETTER':
			case 'MODIFIER_LETTER':
			case 'OTHER_LETTER':
			case 'LETTER_NUMBER':
				return true;
		}
		return false;
	}

	Lex.prototype.isIdentfierPart = function(char) {
		if (char == '$' || char == '_' || char == ZWNJ || char == ZWJ) {
			return true;
		}
		switch (type(char)) {
			case 'UPPERCASE_LETTER':
			case 'LOWERCASE_LETTER':
			case 'TITLECASE_LETTER':
			case 'MODIFIER_LETTER':
			case 'OTHER_LETTER':
			case 'LETTER_NUMBER':
			case 'CONNECTOR_PUNCTUATION':
			case 'DECIMAL_DIGIT_NUMBER':
			case 'NON_SPACING_MARK':
			case 'COMBINING_SPACING_MARK':
				return true;
		}
		return false;
	}

	Lex.prototype.isStrictModeReserved = function(id) {
		return strictReserved.hasOwnProperty(id);
	}

	Lex.prototype.isReserved = function(id) {
		return reserved.hasOwnProperty(id);
	}

	Lex.prototype.isKeyword = function(id) {
		return keywords.hasOwnProperty(id);
	}

	Lex.prototype.dealUnicodeEscapeSequence = function() {
		var d;
		var val = 0;
		for (var i = 0; i < 4; i++) {
			val *= 16;
			d = nextChar(this);
			if (d >= '0' && d <= '9') {
				val += subChar(d, '0');
			} else if (d >= 'A' && d <= 'F') {
				val += subChar(d, 'A') + 10;
			} else if (d >= 'a' && d <= 'f') {
				val += subChar(d, 'a') + 10;
			} else {
				this.throwError("Expected hex digits in unicode escape sequence");
				return "";
			}
		}
		return char(val);
	}

	Lex.prototype.proceedSpaces = function() {
		while (true) {
			var next = nextChar(this);
			switch (next) {
				case TAB:
				case VT:
				case FF:
				case SP:
				case NBSP:
				case BOM:
					break;
				case CR:
					if (lookahead(this) == LF)
						nextChar(this);
				case LF:
				case LS:
				case PS:
					this.line++;
					this.lineBefore = true;
					break;
				case '/':
					var n = lookahead(this);
					pushback(this);
					if (n == '/') {
						this.nextLineComment();
						break;
					} else if (n == '*') {
						this.startPtr = this.ptr;
						this.nextBlockComment();
						break;
					} else {
						return;
					}
				default:
					pushback(this);
					return;
			}
		}
	}

	Lex.prototype.nextRawToken = function() {
		while (true) {
			var next = nextChar(this);
			switch (next) {
				case '/':
					{
						if (lookahead(this) == '=') {
							nextChar(this);
							return new Token('/=');
						} else {
							return new Token('/');
						}
					}
				case '\\':
					{
						pushback(this);
						return this.nextIdentifier();
					}
				case '.':
					{
						var nch = lookahead(this);
						if (nch >= '0' && nch <= '9') {
							pushback(this);
							return this.nextDecimal();
						}
					}
				case '{':
				case '}':
				case '(':
				case ')':
				case '[':
				case ']':
				case ';':
				case ',':
				case '~':
				case '?':
				case ':':
					{
						return new Token(next);
					}
				case '<':
					{
						var nch = lookahead(this);
						if (nch == '=') {
							nextChar(this);
							return new Token('<=');
						} else if (nch == '<') {
							nextChar(this);
							if (lookahead(this) == '=') {
								nextChar(this);
								return new Token('<<=');
							} else {
								return new Token('<<');
							}
						} else {
							return new Token('<');
						}
					}
				case '>':
					{
						var nch = lookahead(this);
						if (nch == '=') {
							nextChar(this);
							return new Token(">=");
						} else if (nch == '>') {
							nextChar(this);
							var n2ch = lookahead(this);
							if (n2ch == '=') {
								nextChar(this);
								return new Token(">>=");
							} else if (n2ch == '>') {
								nextChar(this);
								if (lookahead(this) == '=') {
									nextChar(this);
									return new Token(">>>=");
								} else {
									return new Token('>>>');
								}
							} else {
								return new Token('>>');
							}
						} else {
							return new Token('>');
						}
					}
				case '=':
				case '!':
					{
						if (lookahead(this) == '=') {
							nextChar(this);
							if (lookahead(this) == '=') {
								nextChar(this);
								return new Token(next + "==");
							} else {
								return new Token(next + "=");
							}
						} else {
							return new Token(next);
						}
					}
				case '+':
				case '-':
				case '&':
				case '|':
					{
						var nch = lookahead(this);
						if (nch == '=') {
							nextChar(this);
							return new Token(next + "=");
						} else if (nch == next) {
							nextChar(this);
							return new Token(next + next);
						} else {
							return new Token(next);
						}
					}
				case '*':
				case '%':
				case '^':
					{
						if (lookahead(this) == '=') {
							nextChar(this);
							return new Token(next + '=');
						} else {
							return new Token(next);
						}
					}
				case '0':
					{
						var nch = lookahead(this);
						pushback(this);
						if (nch == 'x' || nch == 'X') {
							return this.nextHexInteger();
						} else if (nch >= '0' && nch <= '9') {
							return this.nextOctInteger();
						} else {
							return this.nextDecimal();
						}
					}
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					{
						pushback(this);
						return this.nextDecimal();
					}
				case '"':
				case '\'':
					{
						pushback(this);
						return this.nextString();
					}
				case '\uFFFF':
					{
						var token = new Token('eof');
						token.lineBefore = true;
						return token;
					}
			}
			if (this.isIdentfierStart(next)) {
				pushback(this);
				return this.nextIdentifier();
			}
			if (lastError) {
				lastError.detail.endOffset = this.ptr;
			} else {
				this.throwError("Unexpected source character(s)");
				var lastError = this.context.lastError();
			}
			this.proceedSpaces();
			this.startPtr = this.ptr;
		}
	}

	Lex.prototype.nextLineComment = function() {
		assertNext(this, '/');
		assertNext(this, '/');
		while (true) {
			var next = nextChar(this);
			switch (next) {
				case CR:
				case LF:
				case LS:
				case PS:
					{
						this.line++;
						this.lineBefore = true;
						return;
					}
				case '\uFFFF':
					return;
			}
		}
	}

	Lex.prototype.nextBlockComment = function() {
		assertNext(this, '/');
		assertNext(this, '*');
		while (true) {
			var next = nextChar(this);
			switch (next) {
				case '*':
					if (lookahead(this) == '/') {
						nextChar(this);
						return;
					}
					break;
				case CR:
				case LF:
				case LS:
				case PS:
					this.line++;
					this.lineBefore = true;
					break;
				case '\uFFFF':
					pushback(this);
					this.throwError("Block comment is not enclosed");
					return;
			}
		}
	}

	Lex.prototype.nextIdentifier = function() {
		var escaped = false;
		var id = nextChar(this);
		if (id == '\\') {
			escaped = true;
			if (nextChar(this) != 'u') {
				this.throwError("Expected unicode escape sequence");
			} else {
				id = this.dealUnicodeEscapeSequence();
				if (id && !this.isIdentfierStart(id)) {
					this.throwError("Illegal unicode escape sequence as identifier start");
				}
			}
		} else {
			assert(this.isIdentfierStart(id));
		}
		while (true) {
			var next = nextChar(this);
			if (next == '\\') {
				escaped = true;
				if (nextChar(this) != 'u') {
					this.throwError("Expected unicode escape sequence");
				} else {
					var val = this.dealUnicodeEscapeSequence();
					if (val && !this.isIdentfierPart(val)) {
						this.throwError("Illegal unicode escape sequence as identifier part");
					}
					id += val;
				}
			} else if (this.isIdentfierPart(next)) {
				id += next;
			} else {
				pushback(this);
				if (this.parseId && !escaped) {
					if (this.isStrictModeReserved(id)) {
						var token = new Token('id');
						token.value = id;
						token.noStrict = 'Future reserved word as identifiers';
						return token;
					} else if (this.isReserved(id)) {
						this.throwError("Reserved word cannot be used as identifiers");
					} else if (this.isKeyword(id)) {
						return new Token(id);
					}
				}
				var token = new Token('id');
				token.value = id;
				return token;
			}
		}
	}

	Lex.prototype.nextOctInteger = function() {
		assertNext(this, '0');
		var raw = "";
		var error = false;
		while (true) {
			var next = nextChar(this);
			if (next >= '0' && next <= '7') {
				raw += next;
			} else if (next == '8' || next == '9') {
				error = true;
			} else {
				pushback(this);
				if (next == '\\' || this.isIdentfierStart(next)) {
					this.nextIdentifier();
					this.throwError("Unexpected character after number literal");
				} else if (error) {
					this.throwError("Unexpected digits in octal number literal");
				}
				var token = new Token('num');
				token.value = parseInt(raw, 8);
				token.noStrict = "Octal literal";
				return token;
			}
		}
	}

	Lex.prototype.nextHexInteger = function() {
		assertNext(this, '0');
		assertNext(this, 'xX');
		var rawNumber = "";
		while (true) {
			var next = nextChar(this);
			if (this.isHexDigit(next)) {
				rawNumber += next;
			} else {
				pushback(this);
				if (next == '\\' || this.isIdentfierStart(next)) {
					this.nextIdentifier();
					this.throwError("Unexpected character after number literal");
				}
				var token = new Token('num');
				token.value = parseInt(rawNumber, 16);
				return token;
			}
		}
	}

	Lex.prototype.nextDecimal = function() {
		var that = this;

		function decimal() {
			var decimal = "";
			while (true) {
				var next = nextChar(that);
				if (next >= '0' && next <= '9') {
					decimal += next;
				} else {
					pushback(that);
					return decimal;
				}
			}
		}

		function exp() {
			assertNext(that, "eE");
			var next = lookahead(that);
			var sign = "+";
			if (next == '+' || next == '-') {
				sign = nextChar(that);
			}
			var expPart = "";
			while (true) {
				var next = nextChar(that);
				if (next >= '0' && next <= '9') {
					expPart += next;
				} else {
					break;
				}
			}
			pushback(that);
			if (!expPart.length) {
				that.throwError("Expected +, - or digits after the exponential mark");
			}
			return "e" + sign + expPart;
		}
		var raw = decimal();
		if (raw) {
			var next = lookahead(this);
			if (next == '.') {
				nextChar(this);
				raw += '.';
				raw += decimal();
				next = lookahead(this);
				if (next == 'e' || next == 'E') {
					raw += exp();
				}
			} else if (next == 'e' || next == 'E') {
				raw += exp();
			}
		} else {
			assertNext(this, '.');
			var dec = decimal();
			assert(dec);
			raw = "." + dec;
			next = lookahead(this);
			if (next == 'e' || next == 'E') {
				raw += exp();
			}
		}
		next = lookahead(this);
		if (next == '\\' || this.isIdentfierStart(next)) {
			this.nextIdentifier();
			this.throwError("Unexpected character after number literal");
		}
		var token = new Token('num');
		token.value = parseFloat(raw);
		return token;
	}

	Lex.prototype.nextString = function() {
		var quote = assertNext(this, '\'"');
		var value = "";
		var oct = false;
		while (true) {
			var next = nextChar(this);
			switch (next) {
				case quote:
					var token = new Token('str');
					token.value = value;
					return token;
				case '\\':
					next = nextChar(this);
					switch (next) {
						case CR:
							if (lookahead(this) == LF) {
								nextChar(this);
								break;
							}
						case LF:
						case LS:
						case PS:
							this.line++;
							break;
						case '\'':
							value += '\'';
							break
						case '"':
							value += '"';
							break;
						case '\\':
							value += '\\';
							break;
						case 'b':
							value += '\b';
							break;
						case 'f':
							value += '\f';
							break;
						case 'n':
							value += '\n';
							break;
						case 'r':
							value += '\r';
							break;
						case 't':
							value += '\t';
							break;
						case 'v':
							value += '\v';
							break;
						case '0':
							{
								var ll1 = lookahead(this);
								if (ll1 < '0' || ll1 > '7') {
									value += '\0';
									break;
								}
							}
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
							{
								oct = true;
								var ll1 = lookahead(this);
								if (ll1 < '0' || ll1 > '7') {
									value += char(subChar(next, '0'));
									break;
								}
								nextChar(this);
								var ll2 = lookahead(this);
								if (ll2 < '0' || ll2 > '7' || (next >= '4' && next <= '7')) {
									value += char(subChar(next, '0') * 8 + subChar(ll1, '0'));
								} else {
									nextChar(this);
									value += char(subChar(next, '0') * 64 + subChar(ll1, '0') * 8 + subChar(ll2, '0'));
								}
								break;
							}

						case 'x':
							var d;
							var val = 0;
							for (var i = 0; i < 2; i++) {
								val *= 16;
								d = nextChar(this);
								if (d >= '0' && d <= '9') {
									val += subChar(d, '0');
								} else if (d >= 'A' && d <= 'F') {
									val += subChar(d, 'A') + 10;
								} else if (d >= 'a' && d <= 'f') {
									val += subChar(d, 'a') + 10;
								} else {
									this.throwError("Expected hex digits in hexical escape sequence");
									break;
								}
							}
							value += char(val);
							break;
						case 'u':
							value += this.dealUnicodeEscapeSequence();
							break;
						default:
							value += next;
							break
					}
					break;
				case CR:
				case LF:
				case LS:
				case PS:
				case '\uFFFF':
					pushback(this);
					this.throwError("String literal is not enclosed");
					var token = new Token('str');
					token.value = value;
					if (oct == true) {
						token.noStrict = 'Octal escape sequence';
					}
					return token;
				default:
					value += next;
					break;
			}
		}
	}

	Lex.prototype.nextRawRegexp = function() {
		assertNext(this, '/');
		var regexp = "";
		var inClass = false;
		loop: while (true) {
			var nxt = nextChar(this);
			switch (nxt) {
				case '/':
					if (inClass) {
						regexp += '/';
						break;
					}
					break loop;
				case '\\':
					nxt = nextChar(this);
					switch (nxt) {
						case CR:
						case LF:
						case LS:
						case PS:
						case '\uFFFF':
							pushback(this);
							this.throwError("Regexp literal is not enclosed");
							break loop;
					}
					regexp += '\\' + nxt;
					break;
				case '[':
					regexp += '[';
					inClass = true;
					break;
				case ']':
					regexp += ']';
					inClass = false;
					break;
				case CR:
				case LF:
				case LS:
				case PS:
				case '\uFFFF':
					pushback(this);
					this.throwError("Regexp literal is not enclosed");
					break loop;
				default:
					regexp += nxt;
					break;
			}
		}
		var flags = "";
		while (true) {
			var next = nextChar(this);
			if (next == '\\') {
				if (nextChar(this) != 'u') {
					this.throwError("Expected unicode escape sequence");
					continue;
				}
				next = this.dealUnicodeEscapeSequence();
				if (!this.isIdentfierPart(next)) {
					this.throwError("Illegal identifier part in regexp flags");
				}
				flags += next;
			} else if (this.isIdentfierPart(next)) {
				flags += next;
			} else {
				pushback(this);
				var token = new Token('regexp');
				token.regexp = regexp;
				token.flags = flags;
				return token;
			}
		}
	}

	Lex.prototype.nextToken = function() {
		this.proceedSpaces();
		this.startPtr = this.ptr;
		var startLine = this.line;
		var ret = this.nextRawToken();
		if (this.lineBefore) {
			ret.lineBefore = this.lineBefore;
			this.lineBefore = false;
		}
		ret.startPtr = this.startPtr;
		ret.startLine = startLine;
		ret.endPtr = this.ptr;
		ret.endLine = this.line;
		return ret;
	}

	Lex.prototype.nextRegexp = function(tk) {
		pushback(this, tk.type.length);
		this.startPtr = this.ptr;
		var startLine = this.line;
		var ret = this.nextRawRegexp();
		if (this.lineBefore) {
			ret.lineBefore = this.lineBefore;
			this.lineBefore = false;
		}
		ret.startPtr = this.startPtr;
		ret.startLine = startLine;
		ret.endPtr = this.ptr;
		ret.endLine = this.line;
		return ret;
	}

	Lex.prototype.getRaw = function(tk) {
		return this.source.substring(tk.startPtr, tk.endPtr);
	}

	return Lex;
}();
},{"../compiler":1,"./chartype":5}],8:[function(require,module,exports){
var syntax = {
	Constant: [],
	Identifier: [],
	RegexpLiteral: [],
	ThisExpression: [],
	ObjectInitializer: ["elements"],
	Property: ["value"],
	Getter: ["body"],
	Setter: ["body"],
	ArrayInitializer: ["elements"],
	MemberExpression: ["base", "property"],
	NewExpression: ["constructor", "arguments"],
	CallExpression: ["callee", "arguments"],
	PostfixExpression: ["operand"],
	UnaryExpression: ["operand"],
	BinaryExpression: ["left", "right"],
	AssignmentExpression: ["left", "right"],
	ConditionalExpression: ["test", "true", "false"],


	BlockStatement: ["body"],
	EmptyStatement: [],
	DebuggerStatement: [],
	ExpressionStatement: ["expression"],
	VariableDeclaration: ["declarations"],
	VariableDeclarator: ["init"],
	IfStatement: ["test", "true", "false"],
	TryStatement: ["body", "catch", "finally"],
	ThrowStatement: ["expression"],
	ReturnStatement: ["expression"],
	SwitchStatement: ["expression", "body"],
	CaseClause: ["key", "body"],
	WithStatement: ["base", "body"],
	WhileStatement: ["test", "body"],
	LabeledStatement: ["body"],
	ForStatement: ["init", "test", "inc", "body"],
	ForInStatement: ["var", "container", "body"],
	ContinueStatement: [],
	BreakStatement: [],
	DoStatement: ["body", "test"],

	FunctionExpression: ["body"],
	FunctionDeclaration: ["body"],
	DirectiveStatement: [],
	Program: ["body"],

	Symbol: []
};

function traverse(ast, options, parent) {
	if (ast === undefined) {
		return;
	} else if (ast instanceof Array) {
		for (var i = 0; i < ast.length; i++) {
			var replace = traverse(ast[i], options, parent);
			if (replace !== undefined) {
				ast[i] = replace;
			}
		}
		return;
	} else if (ast instanceof Object) {
		if (options.enter) {
			var ret = options.enter(ast, parent);
			if (ret !== undefined) {
				return ret;
			}
		}
		var type = syntax[ast.type];
		if (!type) {
			console.log(ast);
			throw new Error("Unsupported Node " + ast.type);
		}
		for (var i = 0; i < type.length; i++) {
			var replace = traverse(ast[type[i]], options, ast);
			if (replace !== undefined) {
				ast[type[i]] = replace;
			}
		}
		if (options.leave) {
			var ret = options.leave(ast, parent);
			if (ret !== undefined) {
				return ret;
			}
		}
	} else {
		console.log('>>>>' + ast);
		throw 'ERROR!!!!';
		if (options.noLiteralVisit) {
			return;
		}
		if (!options.noLiteralEnter && options.enter) {
			var ret = options.enter(ast, parent);
			if (ret !== undefined) {
				return ret;
			}
		}
		if (!options.noLiteralLeave && options.leave) {
			var ret = options.leave(ast, parent);
			if (ret !== undefined) {
				return ret;
			}
		}
	}

}

exports.traverse = function(ast, options) {
	if (!options) {
		options = {};
	}
	traverse(ast, options);
}
},{}],9:[function(require,module,exports){
(function (global){
global.NorlitJSCompiler = require("./compiler.js");
var minify = require("./module/minify");
require("./scope.js");
global.NorlitJSCompiler.minify = minify.minify;
global.NorlitJSCompiler.MinifyPass = minify.MinifyPass;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./compiler.js":1,"./module/minify":3,"./scope.js":4}]},{},[9]);
