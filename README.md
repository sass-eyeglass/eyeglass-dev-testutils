# eyeglass-dev-testutils [![Build Status][travis-ci-badge]][travis-ci] [![Version][npm-version-badge]][npm-version] [![License][license-badge]][license]

A suite of utilities for writing tests in [`eyeglass`][eyeglass] modules.

## Installation

```sh
npm install eyeglass-dev-testutils --save-dev
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

## Custom engines

If you need to use a specific version of Sass or eyeglass, you can pass it via the engine option:

```js
var Testutils = require("eyeglass-dev-testutils");
var sass = require("node-sass");
var eyeglass = require("eyeglass");
var testutils = new Testutils({
  engines: {
    sass: sass,
    eyeglass: eyeglass
  }
});
```

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](apache-license)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.



[travis-ci]: https://travis-ci.org/sass-eyeglass/eyeglass-dev-testutils
[travis-ci-badge]: https://img.shields.io/travis/sass-eyeglass/eyeglass-dev-testutils.svg?style=flat-square
[npm-version]: https://www.npmjs.com/package/eyeglass-dev-testutils
[npm-version-badge]: https://img.shields.io/npm/v/eyeglass-dev-testutils.svg?style=flat-square
[license]: ./LICENSE
[license-badge]: https://img.shields.io/npm/l/eyeglass-dev-testutils.svg?style=flat-square
[eyeglass]: https://github.com/sass-eyeglass/eyeglass
[apache-license]: http://www.apache.org/licenses/LICENSE-2.0