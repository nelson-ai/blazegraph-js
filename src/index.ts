import {merge} from "ramda";
import {SPARQL} from "./sparql";
import {checkPatternExistence, createQuads, deleteQuads, deleteSparql, querySparql, readQuads, updateQuad, updateSparql} from "./middleware";
import {BlazegraphConfig, ZBlazegraphConfig} from "./types";

const defaultConfig: BlazegraphConfig = {
  hostname: "localhost",
  port: 9999,
  namespace: "kb",
  blazename: "bigdata" // it was 'blazegraph' in older versions
}

/** Helper function that wraps other functions as template literals. */
const tmpl = <T>(fn: (a: string) => Promise<T>) =>
  (str: TemplateStringsArray, ...vars: string[]) => {
    const sparql = SPARQL(str, ...vars)
    return fn(sparql)
  }

export const prepareBlaze = (userConfig: Partial<BlazegraphConfig> = {}) => {
  const config = ZBlazegraphConfig.parse(merge(defaultConfig, userConfig));

  const {hostname, port, blazename, namespace} = config
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
