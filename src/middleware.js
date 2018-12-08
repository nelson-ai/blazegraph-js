// @ts-check

/**
 * @typedef {string} IRI
 * @typedef {string} Literal
 * @typedef {import("n3").Quad} Quad
 */

const { compose, replace, join, filter, identity } = require("ramda")
const { Parser: createRdfParser } = require("n3")
const { default: axios } = require("axios")

const {
  isNonEmptyString,
  isQuad,
  isUpdateQuad,
  isPattern
} = require("./utils/validation")

const trigMimeType = "application/x-trig; charset=utf-8"

/* ------
  UTILS
------ */

/**
 * Simple promise wrapper around the 'axios' library
 * @param {import("axios").AxiosRequestConfig} options
 */
const makeRequest = options =>
  axios({
    ...options,
    validateStatus: status => status === 200
  }).then(result => result.data)

/** @param {{subject?:IRI, predicate?:IRI, object?:IRI|Literal, graph?:IRI, graphs?:[IRI]}} input */
const rejectInput = input => {
  const error = new Error(`Invalid input: ${JSON.stringify(input)}`)
  // Remove this function's frame from the stack
  Error.captureStackTrace(error, rejectInput)

  return Promise.reject(error)
}

/** URI encodes a SPARQL query */
const encodeQuery = compose(
  encodeURIComponent,
  replace(/[\t ]+/g, " "), // remove long spaces
  replace(/(^|\n)\s*#.*(\n|$)/g, "") // remove single line comments
)

/**
 * @param {string} name
 * @param {string} val
 */
const urlparam = (name, val) => val && `${name}=${encodeURIComponent(val)}`
const filterValidUrlParams = filter(identity)

/**
 * URI encodes a pattern
 * @param {{subject:IRI, predicate:IRI, object:IRI|Literal, graph:IRI}} $1
 */
const encodePattern = ({ subject, predicate, object, graph }) =>
  compose(
    join("&"),
    filterValidUrlParams
  )([
    urlparam("s", subject),
    urlparam("p", predicate),
    urlparam("o", object),
    urlparam("c", graph)
  ])

/**
 * Serializes a triple or quad into the trig format
 * @param {{subject:IRI, predicate:IRI, object:IRI|Literal, graph:IRI}} $1
 */
const serializeTrig = ({ subject, predicate, object, graph }) => {
  const s = `${subject} ${predicate} ${object} .`

  return graph ? `${graph} { ${s} }` : s
}

/* -----------
  MIDDLEWARE
----------- */

/**
 * Perform a SPARQL query
 * NOTE: this does not allow to perform a SPARQL update query
 * @param {string} blazeUrl
 */
const querySparql = blazeUrl =>
  /**
   * @param {string} query
   * @typedef {{[v:string]:{type:string, value:string}}} SPARQLSelectResult
   * @return {Promise<SPARQLSelectResult[]>}
   */
  (query, withInferred = false) => {
    console.assert(isNonEmptyString(query), "Query must be a non-empty string")
    return makeRequest({
      url: `${blazeUrl}?query=${encodeQuery(
        query
      )}&includeInferred=${!!withInferred}`,
      headers: { Accept: "application/json" }
    }).then(data => data.results.bindings)
  }

/**
 * Perform a SPARQL update, insert or delete.
 * NOTE: this does not allow to perform any other SPARQL query
 * @param {string} blazeUrl
 */
const updateSparql = blazeUrl =>
  /** @param {string} query */
  query => {
    console.assert(isNonEmptyString(query), "Query must be a non-empty string")
    return makeRequest({
      method: "POST",
      url: `${blazeUrl}?update=${encodeQuery(query)}`
    })
  }

/**
 * Delete statements using a SPARQL CONSTRUCT or DESCRIBE query.
 * NOTE: this does not allow to perform any other SPARQL query.
 * @param {string} blazeUrl
 */
const deleteSparql = blazeUrl =>
  /** @param {string} query */
  query => {
    console.assert(isNonEmptyString(query), "Query must be a non-empty string")
    return makeRequest({
      method: "DELETE",
      url: `${blazeUrl}?query=${encodeQuery(query)}`
    })
  }

/**
 * Returns true is some quads match a pattern
 * @param {string} blazeUrl
 */
const checkPatternExistence = blazeUrl =>
  /** @param {{subject?:IRI, predicate?:IRI, object?:IRI|Literal, graph?:IRI, graphs?:[IRI]}} input */
  (input, withInferred = false) => {
    if (!isPattern(input)) return rejectInput(input)

    let fullUrl = `${blazeUrl}?HASSTMT&includeInferred=${!!withInferred}&${encodePattern(
      // @ts-ignore because we checked this using isPattern
      input
    )}`

    if (Array.isArray(input.graphs)) {
      input.graphs.forEach(g => (fullUrl += `&c=${g}`))
    }

    // TODO: this needs to be checked because it was makeRequest(fullUrl) before running @ts-check
    return makeRequest({ url: fullUrl }).then(
      result =>
        isNonEmptyString(result) &&
        /<data result="(\w*)"/.exec(result)[1] === "true"
    )
  }

/**
 * Read all quads matching a pattern
 * @param {string} blazeUrl
 */
const readQuads = blazeUrl =>
  /** @param {{subject?:IRI, predicate?:IRI, object?:IRI|Literal, graph?:IRI, graphs?:[IRI]}} input */
  async (input, withInferred = false) => {
    if (!isPattern(input)) return rejectInput(input)

    let fullUrl = `${blazeUrl}?GETSTMTS&includeInferred=${!!withInferred}&${encodePattern(
      // @ts-ignore because we checked this using isPattern
      input
    )}`

    if (Array.isArray(input.graphs)) {
      input.graphs.forEach(g => (fullUrl += `&c=${g}`))
    }

    const nquads = await makeRequest({ url: fullUrl })
    if (!nquads) return []

    return new Promise(
      /** @param {(value:Quad[]) => void} resolve */
      (resolve, reject) => {
        const quads = []
        createRdfParser().parse(nquads, (error, triple) => {
          if (error) return reject(error)
          if (triple) return quads.push(triple)

          resolve(quads)
        })
      }
    )
  }

/**
 * Create one or more quads.
 * Input can also be an array of quads.
 * @param {string} blazeUrl
 */
const createQuads = blazeUrl =>
  /** @param {{subject:IRI, predicate:IRI, object:IRI|Literal, graph?:IRI}} input */
  input => {
    /** @type {typeof input[]} */
    const inputs = Array.isArray(input) ? input : [input]

    if (inputs.some(quad => !isQuad(quad))) return rejectInput(input)

    return makeRequest({
      url: blazeUrl,
      method: "POST",
      headers: { "Content-Type": trigMimeType },
      data: inputs.map(serializeTrig).join("")
    })
  }

/**
 * Update a quad knowing its old statement.
 * @param {string} blazeUrl
 */
const updateQuad = blazeUrl =>
  /** @param {{subject:IRI, predicate:IRI, oldObject:IRI|Literal, object:IRI|Literal, graph?:IRI}} inputMaybeQuad */
  inputMaybeQuad => {
    if (!isUpdateQuad(inputMaybeQuad)) return rejectInput(inputMaybeQuad)

    /** @type {typeof inputMaybeQuad & {graph:IRI}} */
    // @ts-ignore because we checked it through isUpdateQuad
    const input = inputMaybeQuad

    const oldQuad = serializeTrig({ ...input, object: input.oldObject })
    const newQuad = serializeTrig(input)
    const options = { contentType: trigMimeType }

    return makeRequest({
      url: `${blazeUrl}?updatePost`,
      method: "POST",
      data: {
        remove: { options, value: oldQuad },
        add: { options, value: newQuad }
      }
    })
  }

/**
 * Delete all quads matching a pattern.
 * @param {string} blazeUrl
 */
const deleteQuads = blazeUrl =>
  /** @param {{subject?:IRI, predicate?:IRI, object?:IRI|Literal, graph?:IRI}} input */
  input => {
    if (!isPattern(input)) return rejectInput(input)

    // @ts-ignore because we checked it through isPattern
    const params = encodePattern(input)

    if (!params) {
      return Promise.reject(new Error("You almost deleted the whole database!"))
    }

    return axios.delete(`${blazeUrl}?${params}`).then(result => result.data)
  }

module.exports = {
  querySparql,
  checkPatternExistence,
  readQuads,
  createQuads,
  updateQuad,
  updateSparql,
  deleteQuads,
  deleteSparql
}
