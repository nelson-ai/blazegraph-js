const {
  compose,
  join,
  assocPath,
  over,
  mapObjIndexed,
  complement,
  isEmpty,
  prop,
  map,
  append,
  when,
  isNil,
  lensProp,
  unless,
  groupBy,
  values,
  juxt,
  filter,
  assoc,
  curry
} = require("ramda")

// simple helper functions

const maybeEmptyList = when(isNil, () => [])
const prependStr = pstr => oldstr => `${pstr} ${oldstr}`
const addTripleAt = at => triple => over(lensProp(at), append(triple))

// string generators

const compactAndStringifyTriples = compose(
  join(" .\n"),
  values,
  mapObjIndexed((poList, subject) =>
    compose(
      prependStr(subject),
      join("; "),
      map(({ predicate, object }) => `${predicate} ${object}`)
    )(poList)
  ),
  groupBy(prop("subject")),
  maybeEmptyList
)

const prefixesToStr = compose(
  join("\n"),
  values,
  mapObjIndexed((pval, pname) => `PREFIX ${pname}: <${pval}>`),
  prop("prefixes")
)

const deleteStatementsToStr = compose(
  unless(isEmpty, s => `DELETE { ${s} }`),
  compactAndStringifyTriples,
  prop("deleteStatements")
)

const insertStatementsToStr = compose(
  unless(isEmpty, s => `INSERT { ${s} }`),
  compactAndStringifyTriples,
  prop("insertStatements")
)

const whereStatementsToStr = compose(
  join("\n"),
  map(_ => `OPTIONAL { ${_.subject} ${_.predicate} ${_.object} }`),
  maybeEmptyList,
  prop("whereStatements")
)

const withGraphToStr = ({ graphIri }) => (graphIri ? `WITH ${graphIri}` : "")

// Public API

const withGraph = iri => assoc("graphIri", iri)
const addPrefix = curry((key, url) => assocPath(["prefixes", key], url))
const addInsert = addTripleAt("insertStatements")
const addDelete = triple =>
  compose(
    addTripleAt("deleteStatements")(triple),
    q => {
      // TODO: this is still imperative, impure and ugly
      if (!triple.object) {
        if (q.varSeq) q.varSeq++
        else q.varSeq = 1

        triple.object = `?x${q.varSeq}`

        return addTripleAt("whereStatements")(triple)(q)
      }

      return q
    }
  )

const addUpdate = triple =>
  compose(
    addInsert(triple),
    addDelete({ ...triple, object: triple.oldObject })
  )

/** Converts query object into query string */
const queryToString = compose(
  join("\n"),
  filter(complement(isEmpty)), // only non-empty elements
  juxt([
    prefixesToStr,
    withGraphToStr,
    deleteStatementsToStr,
    insertStatementsToStr,
    whereStatementsToStr
  ])
)

module.exports = {
  addPrefix,
  addInsert,
  addDelete,
  addUpdate,
  withGraph,
  queryToString
}
