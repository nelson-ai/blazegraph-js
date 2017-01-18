# Changelog

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
