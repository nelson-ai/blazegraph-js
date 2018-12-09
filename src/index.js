// @ts-check

const { merge } = require("ramda")
const { SPARQL } = require("./sparql")
const {
  deleteSparql,
  querySparql,
  updateSparql,
  createQuads,
  checkPatternExistence,
  deleteQuads,
  readQuads,
  updateQuad
} = require("./middleware")

/** @typedef {{hostname?:string, port?:number, namespace?:string, blazename?:string}} BlazegraphConfig */
/** @type {BlazegraphConfig} */
const defaultConfig = {
  hostname: "localhost",
  port: 9999,
  namespace: "kb",
  blazename: "bigdata" // it was 'blazegraph' in older versions
}

// helper function that wraps other functons as template literals
/**
 * @template T
 * @param {(a:string) => Promise<T>} fn
 */
const tmpl = fn => /** @param {TemplateStringsArray} str */ (str, ...vars) => {
  const sparql = SPARQL(str, ...vars)
  return fn(sparql)
}

/** @param {BlazegraphConfig} userConfig */
const prepareBlaze = userConfig => {
  const config = merge(defaultConfig, userConfig)
  const { hostname, port, blazename, namespace } = config
  const blazeUri = `http://${hostname}:${port}/${blazename}/namespace/${namespace}/sparql`

  return {
    config,
    blazeUri,
    UPDATE: tmpl(updateSparql(blazeUri)),
    DELETE: tmpl(deleteSparql(blazeUri)),

    /** Use as: SELECT`your sparql query` = querySparql without inferred triples. */
    SELECT: tmpl(querySparql(blazeUri)),

    /** Use as: SELECT`your sparql query` = querySparql with inferred triples.  */
    SELECTWI: tmpl(str => querySparql(blazeUri)(str, true)),

    deleteSparql: deleteSparql(blazeUri),
    querySparql: querySparql(blazeUri),
    updateSparql: updateSparql(blazeUri),

    createQuads: createQuads(blazeUri),
    deleteQuads: deleteQuads(blazeUri),
    readQuads: readQuads(blazeUri),

    updateQuad: updateQuad(blazeUri),
    checkPatternExistence: checkPatternExistence(blazeUri)
  }
}

module.exports = {
  prepareBlaze
}
