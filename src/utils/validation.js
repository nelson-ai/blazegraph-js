/** @param {string} value */
const isNonEmptyString = value => value && typeof value === "string"

/** @param {string} value */
const isStringOrNil = value =>
  isNonEmptyString(value) || typeof value === "undefined" || value === null

/** @param {{subject:string, predicate:string, object:string}} t */
const isTriple = t =>
  typeof t === "object" &&
  isNonEmptyString(t.subject) &&
  isNonEmptyString(t.predicate) &&
  isNonEmptyString(t.object)

/** @param {{subject:string, predicate:string, object?:string}} t */
const isDeleteTriple = t =>
  typeof t === "object" &&
  isNonEmptyString(t.subject) &&
  isNonEmptyString(t.predicate) &&
  isStringOrNil(t.object)

/** @param {{subject:string, predicate:string, object:string, oldObject?:string}} t */
const isUpdateTriple = t => isTriple(t) && isStringOrNil(t.oldObject) // !

/** @param {{subject:string, predicate:string, object:string, graph?:string}} q */
const isQuad = q => isTriple(q) && isStringOrNil(q.graph)

/** @param {{subject:string, predicate:string, object:string, graph?:string, oldObject?:string}} q */
const isUpdateQuad = q => isQuad(q) && isNonEmptyString(q.oldObject) // !

/** @param {{subject?:string, predicate?:string, object?:string, graph?:string}} p */
const isPattern = p =>
  typeof p === "object" &&
  isStringOrNil(p.subject) &&
  isStringOrNil(p.predicate) &&
  isStringOrNil(p.object) &&
  isStringOrNil(p.graph)

module.exports = {
  isNonEmptyString,
  isStringOrNil,
  isTriple,
  isDeleteTriple,
  isUpdateTriple,
  isQuad,
  isUpdateQuad,
  isPattern
}
