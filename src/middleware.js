// @ts-check
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

const rejectInput = input => {
  const error = new Error(`Invalid input: ${JSON.stringify(input)}`)
  // Remove this function's frame from the stack
  Error.captureStackTrace(error, rejectInput)

  return Promise.reject(error)
}

/** URI encodes a SPARQL query */
const encodeQuery = compose(
  encodeURIComponent,
  replace("\t", ""),
  replace("\n", " ")
)

const urlparam = (name, val) => val && `&${name}=${encodeURIComponent(val)}`
const filterValidUrlParams = filter(identity)

// URI encodes a pattern
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

// Serializes a triple or quad into the trig format
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
 */
const querySparql = (query, withInferred = false) => blazeUrl => {
  if (!isNonEmptyString(query)) {
    return Promise.reject(new Error("Query must be a non-empty string"))
  }

  return makeRequest({
    url: `${blazeUrl}?query=${encodeQuery(
      query
    )}&includeInferred=${!!withInferred}`,
    headers: {
      Accept: "application/json"
    }
  }).then(json => json.results.bindings)
}

/**
 * Perform a SPARQL update, insert or delete.
 * NOTE: this does not allow to perform any other SPARQL query
 */
const updateSparql = query => blazeUrl => {
  if (!isNonEmptyString(query)) {
    return Promise.reject(new Error("Query must be a non-empty string"))
  }

  return makeRequest({
    method: "post",
    url: `${blazeUrl}?update=${encodeQuery(query)}`
  })
}

/**
 * Delete statements using a SPARQL CONSTRUCT or DESCRIBE query.
 * NOTE: this does not allow to perform any other SPARQL query.
 */
const deleteSparql = query => blazeUrl => {
  if (!isNonEmptyString(query)) {
    return Promise.reject(new Error("Query must be a non-empty string"))
  }

  return makeRequest({
    method: "DELETE",
    url: `${blazeUrl}?query=${encodeQuery(query)}`
  })
}

/**
 * Returns true is some quads match a pattern
 * @example
 * {
 *   subject?: <IRI>
 *   predicate?: <IRI>
 *   object?: <IRI> or "Literal"
 *   graph?: <IRI>
 *   graphs?: [<IRI>]
 * }
 */
const checkPatternExistence = (input, withInferred = false) => blazeUrl => {
  if (!isPattern(input)) return rejectInput(input)

  let fullUrl = `${blazeUrl}?HASSTMT&includeInferred=${!!withInferred}&${encodePattern(
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
 * @example
 * {
 *   subject?: <IRI>
 *   predicate?: <IRI>
 *   object?: <IRI> or "Literal"
 *   graph?: <IRI>
 *   graphs?: [<IRI>]
 * }
 */
const readQuads = (input, withInferred = false) => async blazeUrl => {
  if (!isPattern(input)) return rejectInput(input)

  let fullUrl = `${blazeUrl}?GETSTMTS&includeInferred=${!!withInferred}&${encodePattern(
    input
  )}`

  if (Array.isArray(input.graphs)) {
    input.graphs.forEach(g => (fullUrl += `&c=${g}`))
  }

  const nquads = await makeRequest({ url: fullUrl })
  if (!nquads) return []

  return new Promise((resolve, reject) => {
    const quads = []
    createRdfParser().parse(nquads, (error, triple) => {
      if (error) return reject(error)
      if (triple) return quads.push(triple)

      resolve(quads)
    })
  })
}

/**
 * Create one or more quads.
 * Input can also be an array of quads.
 * @example
 * {
 *   subject: <IRI>
 *   predicate: <IRI>
 *   object: <IRI> or "Literal"
 *   graph?: <IRI>
 * }
 */
const createQuads = input => blazeUrl => {
  const inputs = Array.isArray(input) ? input : [input]

  if (inputs.some(quad => !isQuad(quad))) return rejectInput(input)

  return makeRequest({
    url: blazeUrl,
    method: "POST",
    headers: {
      "Content-Type": trigMimeType
    },
    data: inputs.map(serializeTrig).join("")
  })
}

/**
 * Update a quad knowing its old statement.
 * @example
 * {
 *   subject: <IRI>
 *   predicate: <IRI>
 *   oldObject: <IRI> or "Literal", from the old statement
 *   object: <IRI> or "Literal", defines the new statement
 *   graph?: <IRI>
 * }
 */
const updateQuad = input => blazeUrl => {
  if (!isUpdateQuad(input)) {
    return rejectInput(input)
  }

  const oldQuad = serializeTrig({ ...input, object: input.oldObject })
  const newQuad = serializeTrig(input)
  const options = { contentType: trigMimeType }

  return makeRequest({
    url: `${blazeUrl}?updatePost`,
    method: "POST",
    // TODO: check this because it was formData befor running @ts-check
    data: {
      remove: {
        options,
        value: oldQuad
      },
      add: {
        options,
        value: newQuad
      }
    }
  })
}

/**
 * Delete all quads matching a pattern.
 * @example
 * {
 *   subject?: <IRI>
 *   predicate?: <IRI>
 *   object?: <IRI> or "Literal"
 *   graph?: <IRI>
 * }
 */
const deleteQuads = input => blazeUrl => {
  if (!isPattern(input)) {
    return rejectInput(input)
  }

  const params = encodePattern(input)

  if (!params) {
    return Promise.reject(new Error("You almost deleted the whole database!"))
  }

  return makeRequest({
    url: `${blazeUrl}?${params}`,
    method: "DELETE"
  })
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
