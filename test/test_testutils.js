"use strict";

var path = require("path");
var assert = require("assert");
var sass = require("sass");
var eyeglass = require("eyeglass");

var Testutils = require("../index");
var testutils = new Testutils({
  engines: {
    sass: sass,
    eyeglass: eyeglass
  }
});

var fixtureDir = path.join(__dirname, "fixtures");

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
  it("should compile and assert each fixture", function() {
    // TODO - handle exception case
    var fixtures = testutils.getSassFixtures(fixtureDir);
    Object.keys(fixtures).forEach(function(name) {
      var fixture = fixtures[name];
      describe("Compile Fixture `" + name + "`", function() {
        it("the output should match " + name + ".css", function(done) {
          testutils.assertCompiles({options:{data: fixture.source}}, fixture.expected, done);
        });
      });
    });
  });
});
