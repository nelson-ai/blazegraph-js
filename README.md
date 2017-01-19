# Blazegraph JavaScript API

[![npm version](https://badge.fury.io/js/blazegraph.svg)](https://www.npmjs.com/package/blazegraph)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

[Blazegraph](https://www.blazegraph.com/) JavaScript API.

## Installation

`npm install blazegraph --save`

## Usage

Many (undocumented yet) methods are available. Have a look at the source for more info.

```js
const db = require('blazegraph')({
  host: 'localhost',
  port: 9999,
  namespace: 'kb', // Those are the default values, passing no params yields the same result
});

db.readQuads({
  predicate: '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>',
  object: '<http://example.com/Person>',
})
.then(quads => {
  console.log(quads); // An array of objects of the shape { subject, predicate, object, graph }
});
```

## Note

Unstable, do not use in production!
The current API is quite specific to Nelson, but feel free to PR breaking changes to make it universal.

## Contributing

Yes, thank you. Please lint, ~~update/write tests~~ and add your name to the package.json file before you PR.

## License

Blazegraph-js is released under the MIT license.

[Blazegraph](https://www.blazegraph.com/) is freely available under the GPLv2 open-source license.
