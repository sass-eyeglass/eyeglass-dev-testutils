# eyeglass-dev-testutils

[![Build Status](https://travis-ci.org/sass-eyeglass/eyeglass-dev-testutils.svg)](https://travis-ci.org/sass-eyeglass/eyeglass-dev-testutils)
[![Version](https://img.shields.io/npm/v/eyeglass-dev-testutils.svg)](https://www.npmjs.com/package/eyeglass-dev-testutils)
[![License](https://img.shields.io/npm/l/eyeglass-dev-testutils.svg)](./LICENSE)

A suite of utilities for writing tests in eyeglass modules.

## Installation

```sh
npm install eyeglass-dev-testutils --save
```

## Usage

Example `test_my_project.js` file.

```js
var testutils = require("eyeglass-dev-testutils");
var path = require("path");

var fixtureDir = path.join(__dirname, "fixtures");  // ./test/fixtures/
var fixtures = testutils.getSassFixtures(fixtureDir); // returns a collection of test fixtures

// for each fixture...
Object.keys(fixtures).forEach(function(name) {
  var fixture = fixtures[name];

  describe("Compile Fixture `" + name + "`", function() {
    // assert the compiled source matches the expected CSS
    it("the output should match " + name + ".css", function(done) {
      testutils.assertCompiles(fixture.source, fixture.expected, done);
    });
  });
});
```

Your test directory would look something like this:

```
├── fixtures
│   ├── simpleTest.css
│   ├── simpleTest.scss
│   ├── someTest.css
│   ├── someTest.scss
│   ├── someTest2.css
│   └── someTest2.scss
└── test_my_project.js
```