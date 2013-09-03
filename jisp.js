// Minimal LISP in JavaScript
// Based on lispy: http://norvig.com/lispy.html

(function(global) {

  function Env(params, args, outer) {
    this.outer = outer;
    this.dict = Object.create(null);
    this.get = function(v) { return this.dict['$'+v]; };
    this.set = function(v, val) { this.dict['$'+v] = val; };
    this.find = function(v) {
      if (('$'+v) in this.dict)
        return this;
      return this.outer ? this.outer.find(v) : null;
    };

    if (params && args) {
      for (var i = 0; i < params.length; ++i) {
        this.set(params[i], args[i]);
      }
    }
  }

  var global_env = new Env();
  var glob_init = {
    '+': function() { return [].reduce.call(arguments, function(a, b) { return a + b; }); },
    '-': function(a, b) { return a-b; },
    '*': function() { return [].reduce.call(arguments, function(a, b) { return a * b; }); },
    '/': function(a, b) { return a/b; },
    'and': function(a, b) { return a && b; },
    'or': function(a, b) { return a || b; },
    'not': function(a) { return !a; },
    '>': function(a, b) { return a > b; },
    '<': function(a, b) { return a < b; },
    '>=': function(a, b) { return a >= b; },
    '<=': function(a, b) { return a <= b; },
    '=': function(a, b) { return a == b; },
    'equal?': function(a, b) { return a === b; },
    'eq?': function(a, b) { return a === b; },
    'length': function(a) { return a.length; },
    'cons': function(a, b) { return [a].concat(b); },
    'car': function(a) { return a[0]; },
    'cdr': function(a) { return a.slice(1); },
    'append': function(a, b) { return a.concat(b); },
    'list': function() { return [].slice.call(arguments); },
    'list?': function(a) { return Array.isArray(a); },
    'null?': function(a) { return Array.isArray(a) && !a.length; },
    'symbol?': function(a) { return typeof a === 'string'; }
  };
  Object.keys(glob_init).forEach(function(key) {
    global_env.set(key, glob_init[key]);
  });
  ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp',
   'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin',
   'sqrt', 'tan'].forEach(function(n) {
     global_env.set(n, Math[n]);
   });

  function truth(t) {
    return Array.isArray(t) ? t.length : t;
  }

  function eval(x, env) {
    env = env || global_env;
    if (typeof x === 'string') // all strings are symbols; variable reference
      return env.find(x).get(x);
    if (!Array.isArray(x)) // constant literal
      return x;
    if (x[0] === 'quote') // (quote exp)
      return x[1];
    if (x[0] === 'if') // (if test conseq alt)
      return eval(truth(eval(x[1], env)) ? x[2] : x[3], env);
    if (x[0] === 'set!') // (set! var exp)
      return env.find(x[1]).set(x[1], eval(x[1], env));
    if (x[0] === 'define') // (define var exp)
      return env.set(x[1], eval(x[2], env));
    if (x[0] === 'lambda') // (lambda (var*) exp)
      return function() { return eval(x[2], new Env(x[1], arguments, env)); };
    if (x[0] === 'begin') { // (begin exp*)
      for (var i = 1; i < x.length; ++i) {
        var val = eval(x[i], env);
      }
      return val;
    }
    // (proc exp*)
    var exps = x.map(function(exp) { return eval(exp, env); });
    var proc = exps.shift();
    return proc.apply(null, exps);
  }

  function read(s) {
    return read_from(tokenize(s));
  }
  var parse = read;

  function tokenize(s) {
    return s.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/^\s+|\s+$/g, '').split(/\s+/g);
  }

  function read_from(tokens) {
    if (!tokens.length)
      throw new SyntaxError('unexpected EOF while reading');
    var token = tokens.shift();
    if ('(' === token) {
      var l = [];
      while (tokens[0] !== ')') {
        l.push(read_from(tokens));
      }
      tokens.shift(); // ')'
      return l;
    } else if (')' === token) {
      throw new SyntaxError('unexpected )');
    } else {
      return atom(token);
    }
  }

  function atom(token) {
    var number = Number(token);
    if (!isNaN(number) || token === 'NaN')
      return number;
    return String(token);
  }

  function to_string(exp) {
    if (Array.isArray(exp))
      return '(' + exp.map(to_string).join(' ') + ')';
    else
      return String(exp);
  }

  function replish(str) {
    var program = parse(str);
    return to_string(eval(program));
  }

  global.replish = replish;

}(this));
