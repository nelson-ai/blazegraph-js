# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.0"></a>
# [1.0.0](https://github.com/nelson-ai/blazegraph-js/compare/v0.2.0...v1.0.0) (2018-12-07)


### Bug Fixes

* convert validation functions to lambdas ([bf4f657](https://github.com/nelson-ai/blazegraph-js/commit/bf4f657))
* I used ts-check in vscode IDE to find some bugs ([4c854c8](https://github.com/nelson-ai/blazegraph-js/commit/4c854c8))
* missing variable blazename ([5bc93d8](https://github.com/nelson-ai/blazegraph-js/commit/5bc93d8))
* use `axios` instead of `request` ([985f551](https://github.com/nelson-ai/blazegraph-js/commit/985f551))


### Features

* new API in functional programming style ([f8090f1](https://github.com/nelson-ai/blazegraph-js/commit/f8090f1))
* new SPARQL Template literal ([4972a6a](https://github.com/nelson-ai/blazegraph-js/commit/4972a6a))
* new sparql updater module writtein in FP-style ([e47b414](https://github.com/nelson-ai/blazegraph-js/commit/e47b414))


### BREAKING CHANGES

* the url config now accepts `hostname`
instead of `host`.
* completely different API which uses template literals
* replaces the original sparqlUpdateQueryFactory



# Changelog

## 0.3.0

**Breaking changes:**
- new, functional style API (with the help of `ramda`)
- using `axios` instead of `request`
- deprecated `SparqlUpdateQuery.js` and replaced with functional-style API in `src/updater.js`

**New features:**
- unit tests including a docker-compose.yml
- using `SELECT`, `UPDATE`, `DELETE` template literals

## 0.2.0

**Breaking changes:**
- updateQuad method first argument now requires "object and "oldObject" keys (instead of "object and "newObject")

**New features:**
- Added SparqlUpdateQuery class

## 0.1.0

**New features:**
- Added querySparql method
- Added checkPatternExistence method
- Added includeInferred option on readQuads

**Bug fixes:**
- Fixed readQuads bug when resolving empty result
- Use Trig Media type with UTF-8 charset for POSTing and PUTing data
- Fixed concurrent parsing bug

## 0.0.1

First release! :tada:
