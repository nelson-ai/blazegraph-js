// @ts-check
const { compose, merge } = require("ramda")
const { SPARQL } = require("./sparql")
const {
  deleteSparql,
  querySparql,
  updateSparql,
  ...otherFun
} = require("./middleware")

const defaultOptions = {
  hostname: "localhost",
  port: 9999,
  namespace: "kb",
  blazename: "bigdata" // it was 'blazegraph' before
}

/** @type {(config:{ hostname?:string, port?:number, namespace?:string, blazename?:string }) => string} */
const prepareBlazeUrl = compose(
  ({ hostname, port, namespace, blazename }) =>
    `http://${hostname}:${port}/${blazename}/namespace/${namespace}/sparql`,
  merge(defaultOptions),
  merge({})
)

// helper function that wraps other functons as template literals
const tmpl = fn => (str, ...vars) => fn(SPARQL(str, ...vars))

module.exports = {
  prepareBlazeUrl,
  SELECT: tmpl(querySparql),
  UPDATE: tmpl(updateSparql),
  DELETE: tmpl(deleteSparql),
  ...otherFun
}
