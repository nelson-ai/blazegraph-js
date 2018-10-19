# Blazegraph JavaScript API

[![npm version](https://badge.fury.io/js/blazegraph.svg)](https://www.npmjs.com/package/blazegraph)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

[Blazegraph](https://www.blazegraph.com/) JavaScript API.

## Installation

`npm install blazegraph --save`

## Usage

Many (undocumented yet) methods are available. Have a look at the source for more info.

### preparation
```js
const {prepareBlazeUrl} = require('blazegraph')
const db = prepareBlazeUrl({
  host: 'localhost',
  port: 9999,
  namespace: 'kb', // Those are the default values, passing no params yields the same result
});
```

### sparql query - output written to the console
```js
const {composeP} = require('ramda')
const {SELECT} = require('blazegraph')
composeP(
  console.log, // An array of objects of the shape { subject, predicate, object, graph }
  SELECT`select * { ?s ?p ?o } limit 10`,
)(db)
```

### read quads - output written to the console
```js
const {composeP} = require('ramda')
const {readQuads} = require('blazegraph')
composeP(
  console.log, // An array of objects of the shape { subject, predicate, object, graph }
  readQuads({
    predicate: '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>',
    object: '<http://example.com/Person>',
  })
)(db)
```

### single pipeline using default options
```js
const {composeP} = require('ramda')
const {SELECT, prepareBlazeUrl} = require('blazegraph')

composeP(
  console.log,
  SELECT`select * { ?s ?p ?o } limit 10`,
  prepareBlazeUrl
)()
```

## Note

Unstable, do not use in production!
The current API is quite specific to Nelson, but feel free to PR breaking changes to make it universal.

## Contributing

Yes, thank you. Please lint, ~~update/write tests~~ and add your name to the package.json file before you PR.

## License

Blazegraph-js is released under the MIT license.

[Blazegraph](https://www.blazegraph.com/) is freely available under the GPLv2 open-source license.
