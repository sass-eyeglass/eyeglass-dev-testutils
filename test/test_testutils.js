"use strict";

var path = require("path");
var assert = require("assert");
var sass = require("sass");
var nodeSass = require("node-sass");
var eyeglass = require("eyeglass");
var cssbeautify = require("cssbeautify");
var Testutils = require("../index");

var testSuites = [];

function formatter(str) {
  return cssbeautify(str, {
    indent: "  ",
    autosemicolon: false,
  });
}

testSuites.push({
  suiteName: "sass",
  testutils: new Testutils({
    engines: {
      sass: sass,
      eyeglass: eyeglass
    }
  })
});

testSuites.push({
  suiteName: "node-sass",
  testutils: new Testutils({
    engines: {
      sass: nodeSass,
      eyeglass: eyeglass
    },
    options: {
      formatter: formatter // Pass a formatter in to ensure that the node-sass output can match dart-sass
    }
  }),

});

var fixtureDir = path.join(__dirname, "fixtures");

testSuites.forEach(function(suite) {
  var suiteName = suite.suiteName;
  var testutils = suite.testutils;

  describe("engine: " + suiteName, function() {
    describe("#getSassFixtures", function() {
      var fixtures;

      beforeEach(function() {
        fixtures = testutils.getSassFixtures(fixtureDir);
      });

      it("should return the collection of fixtures (keys)", function() {
        assert.deepEqual(Object.keys(fixtures), ["empty", "simple"]);
      });

      it("should return the collection of fixtures (source)", function() {
        assert.equal(fixtures.empty.source, "\/\/ this file intentionally left blank");
        assert.equal(fixtures.simple.source, ".simple {\n  color: rgba(red, 0.8);\n}\n");
      });

      it("should return the collection of fixtures (expected)", function() {
        assert.equal(fixtures.empty.expected, "");
        assert.equal(fixtures.simple.expected, ".simple {\n  color: rgba(255, 0, 0, 0.8);\n}\n");
      });
    });

    describe("#assertCompiles", function() {
      describe("should compile and assert each fixture", function() {
        // TODO - handle exception case
        var fixtures = testutils.getSassFixtures(fixtureDir);
        Object.keys(fixtures).forEach(function(name) {
          var fixture = fixtures[name];
          describe("Compile Fixture `" + name + "`", function() {
            it("the output should match " + name + ".css", function (done) {
              var source = fixture.source;
              var expected = fixture.expected;

              testutils.assertCompiles({options:{data: source}}, expected, done);
            });
          });
        });
      });
    });
  });
});


function isNodeSassTestSuite(suiteName) {
  return suiteName === "node-sass";
}
