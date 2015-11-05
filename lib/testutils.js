"use strict";

var assert = require("assert");
var diffy = require("diff");
var chalk = require("chalk");
var glob = require("glob");
var fs = require("fs");
var merge = require("lodash.merge");

function normalizeCss(css) {
  return css.trim();
}

function readFile(filePath, encoding) {
  try {
    fs.statSync(filePath);
    return fs.readFileSync(filePath, encoding);
  }
  catch (e) {
    return "";
  }
}

function getError(error) {
  var match = error.match(/^\/(.+)\/([a-z]*)$/);
  if (match) {
    error = new RegExp(match[1], match[2]);
  }
  return error;
}

function Testutils(options) {
  options = merge({
    // engines
    engines: {
      eyeglass: require("eyeglass"),
      sass: require("node-sass")
    },
    options: {}
  }, options);

  this.options = options.options;
  this.engines = {
    eyeglass: options.engines.eyeglass,
    sass: options.engines.sass
  };
}

var methods = {
  getSassFixtures: function(fixtureDir) {
    var rExt = /\.s[ac]ss$/;
    var encoding = "utf8";

    var files = glob.sync(fixtureDir + "**/[^_]*.s[ac]ss");

    return files.reduce(function(obj, sourceFile) {
      var expectedFile = sourceFile.replace(rExt, ".css");
      var dataFile = sourceFile.replace(rExt, ".json");
      var name = sourceFile.replace(fixtureDir, "").replace(rExt, "")
        .replace(/^\//, "");

      var current = obj[name] = {
        source: readFile(sourceFile, encoding),
        expected: readFile(expectedFile, encoding),
        data: JSON.parse(readFile(dataFile, encoding) || null)
      };

      if (current.data && current.data.expectedError) {
        current.error = getError(current.data.expectedError);
      }

      return obj;
    }, {});
  },
  assertCompilesSync: function(options, expectedOutput, name) {
    try {
      var result = this.compileSync(options);
      this.assertExpectedCSS(result.css.toString(), expectedOutput, name);
    }
    catch (err) {
      assert(!err, err.toString());
    }
  },
  assertCompiles: function(options, expectedOutput, done, name) {
    this.compile(options, function(err, result) {
      assert(!err, err && err.message);
      this.assertExpectedCSS(result.css.toString(), expectedOutput, name);
      done();
    }.bind(this));
  },
  assertCompilationError: function(options, expectedError, done) {
    this.compile(options, function(err, result) {
      assert(err);
      assert(!result);
      this.assertErrorMessage(err.message, expectedError);
      done();
    }.bind(this));
  },
  compile: function(options, cb, name) {
    this.engines.sass.render(this.sassOptions(options), cb, name);
  },
  compileSync: function(options, name) {
    return this.engines.sass.renderSync(this.sassOptions(options), name);
  },
  sassOptions: function(options) {
    if (typeof options === "string") {
      options = merge(this.options, {
        data: options
      });
    }
    if (typeof options.sassOptions === "function") {
      return options.sassOptions();
    }
    else {
      options = merge(this.options, options);
      return new this.engines.eyeglass.Eyeglass(options, this.engines.sass).sassOptions();
    }
  },
  assertCompilesFixture: function(fixture, done) {
    if (fixture.data && fixture.error) {
      this.assertCompilationError(fixture.source, fixture.error, done);
    }
    else {
      this.assertCompiles(fixture.source, fixture.expected || "", done);
    }
  },
  assertExpectedCSS: function(output, expected, name) {
    var diffStr = "";
    var isSame = true;
    if (expected instanceof RegExp) {
      isSame = expected.test(normalizeCss(output));
    }
    else {
      var diff = diffy.diffCss(normalizeCss(expected), normalizeCss(output));

      diff.forEach(function(part) {
        var value = part.value;
        if (part.added || part.removed) {
          isSame = false;
          value = (part.added ? chalk.red.inverse : chalk.green.inverse)(value);
        }
        diffStr += value;
      });
    }

    if (name) {
      diffStr = "[" + chalk.gray(name) + "]\n" + diffStr;
    }
    diffStr = chalk.reset(diffStr);
    var msg = "the output does not match\n" + diffStr;
    assert.ok(isSame, msg);
  },
  assertMultilineEqual: function(string1, string2) {
    var lines1 = string1.split("\n");
    var lines2 = string2.split("\n");
    lines1.forEach(function(line1, lineNum) {
      var line2 = lines2[lineNum];
      var msg = "expected line #" + (lineNum + 1) + " to be the same";
      assert.equal(line1, line2, msg);
    });
  },
  assertErrorMessage: function(message, expected) {
    if (expected instanceof RegExp) {
      assert.ok(expected.test(message));
    }
    else {
      this.assertMultilineEqual(message, expected);
    }
  }
};

var testutilsInstance = new Testutils();

Object.keys(methods).forEach(function(methodName) {
  var method = methods[methodName];
  Testutils.prototype[methodName] = method;
  Testutils[methodName] = method.bind(testutilsInstance);
});

module.exports = Testutils;
