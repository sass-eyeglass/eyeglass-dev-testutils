"use strict";

var assert = require("assert");
var diffy = require("diff");
var chalk = require("chalk");
var glob = require("glob");
var fs = require("fs");
var merge = require("lodash.merge");

function trimCss(css, options) {
  return css.trim();
}

function readFile(filePath, encoding) {
  try {
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
  if (!(this instanceof Testutils)) {
    return new Testutils(options);
  }

  options = merge({
    // engines
    engines: {},
    options: {
      formatter: trimCss
    },
  }, options);

  this.options = options.options;
  this.engines = {
    eyeglass: options.engines.eyeglass,
    sass: options.engines.sass
  };

  if (!this.engines.eyeglass || !this.engines.sass) {
    throw new Error("you must now pass your sass and eyeglass \
      engine explicitly to eyeglass-dev-testutils");
  }
}

Testutils.prototype.getSassFixtures = function(fixtureDir) {
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
};

Testutils.prototype.assertCompilesSync = function(options, expectedOutput, name) {
  try {
    var result = this.compileSync(options);
    this.assertExpectedCSS(result.css.toString(), expectedOutput, name);
  }
  catch (err) {
    assert(!err, err.toString());
  }
};

Testutils.prototype.assertCompiles = function(options, expectedOutput, done, name) {
  this.compile(options, function(err, result) {
    assert(!err, err && err.message);

    var css = result.css.toString();
    // If a formatter is provided use it.
    var actual = this.options.formatter ? this.format(css) : css;
    var expected = expectedOutput;
    this.assertExpectedCSS(actual, expected, name);
    done();
  }.bind(this));
};

Testutils.prototype.assertCompilationError = function(options, expectedError, done) {
  this.compile(options, function(err, result) {
    assert(err);
    assert(!result);
    this.assertErrorMessage(err.message, expectedError);
    done();
  }.bind(this));
};

Testutils.prototype.compile = function (options, cb) {
  var opts = this.sassOptions(options);
  this.engines.sass.render(opts, cb);
};

Testutils.prototype.compileSync = function(options) {
  return this.engines.sass.renderSync(this.sassOptions(options));
};

Testutils.prototype.sassOptions = function(options) {
  if (typeof options === "string") {
    options = merge({}, this.options, {
      data: options
    });
  }
  // Eyeglass 0.8.0+
  if (options.options) {
    return options.options;
  }
  // Eyeglass <0.8.0
  if (typeof options.sassOptions === "function") {
    return options.sassOptions();
  }
  // raw options, pass them into Eyeglass
  else {
    options = merge({}, this.options, options, {
      engines: {
        sass: this.engines.sass
      },
      eyeglass: {
        engines: {
          sass: this.engines.sass
        }
      }
    });

    return this.engines.eyeglass(options);
  }
};

Testutils.prototype.assertCompilesFixture = function(fixture, done) {
  if (fixture.data && fixture.error) {
    this.assertCompilationError(fixture.source, fixture.error, done);
  }
  else {
    this.assertCompiles(fixture.source, fixture.expected || "", done);
  }
};

Testutils.prototype.assertExpectedCSS = function(output, expected, name) {
  var diffStr = "";
  var isSame = true;
  if (expected instanceof RegExp) {
    isSame = expected.test(this.format(output));
  }
  else {
    var diff = diffy.diffCss(this.format(expected), this.format(output));

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
};

Testutils.prototype.assertMultilineEqual = function(string1, string2) {
  var lines1 = string1.split("\n");
  var lines2 = string2.split("\n");
  lines1.forEach(function(line1, lineNum) {
    var line2 = lines2[lineNum];
    var msg = "expected line #" + (lineNum + 1) + " to be the same";
    assert.equal(line1, line2, msg);
  });
};

Testutils.prototype.assertErrorMessage = function(message, expected) {
  if (expected instanceof RegExp) {
    assert.ok(expected.test(message));
  }
  else {
    this.assertMultilineEqual(message, expected);
  }
};

Testutils.prototype.format = function(str) {
  return this.options.formatter ? this.options.formatter(str) : trimCss(str);
};

module.exports = Testutils;
