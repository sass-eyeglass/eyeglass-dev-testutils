"use strict";

var eyeglass = require("eyeglass");
var sass = require("node-sass");
var assert = require("assert");
var diffy = require("diff");
var chalk = require("chalk");
var glob = require("glob");
var fs = require("fs");

function normalizeCss(css) {
  return css.trim();
}

function readFile(path, encoding) {
  try {
    fs.statSync(path);
    return fs.readFileSync(path, encoding);
  }
  catch (e) {
    return "";
  }
}

module.exports = {
  getSassFixtures: function(fixtureDir) {
    var rExt = /\.s[ac]ss$/;
    var encoding = "utf8";

    var files = glob.sync(fixtureDir + "**/[^_]*.s[ac]ss");

    return files.reduce(function(obj, sourceFile) {
      var expectedFile = sourceFile.replace(rExt, ".css");
      var name = sourceFile.replace(fixtureDir, "").replace(rExt, "")
        .replace(/^\//, "");

      obj[name] = {
        source: readFile(sourceFile, encoding),
        expected: readFile(expectedFile, encoding)
      };

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
    sass.render(this.sassOptions(options), cb, name);
  },
  compileSync: function(options, name) {
    return sass.renderSync(this.sassOptions(options), name);
  },
  sassOptions: function(options) {
    if (typeof options === "string") {
      options = {
        data: options
      };
    }
    if (typeof options.sassOptions === "function") {
      return options.sassOptions();
    }
    else {
      return eyeglass.decorate ? eyeglass.decorate(options) : eyeglass(options).sassOptions();
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
