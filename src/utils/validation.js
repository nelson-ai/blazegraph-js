const isNonEmptyString = value => value && typeof value === "string"
const isStringOrNil = value =>
  isNonEmptyString(value) || typeof value === "undefined" || value === null

const isTriple = t =>
  typeof t === "object" &&
  isNonEmptyString(t.subject) &&
  isNonEmptyString(t.predicate) &&
  isNonEmptyString(t.object)

const isDeleteTriple = t =>
  typeof t === "object" &&
  isNonEmptyString(t.subject) &&
  isNonEmptyString(t.predicate) &&
  isStringOrNil(t.object)

const isUpdateTriple = t => isTriple(t) && isStringOrNil(t.oldObject) // !

const isQuad = q => isTriple(q) && isStringOrNil(q.graph)

const isUpdateQuad = q => isQuad(q) && isNonEmptyString(q.oldObject) // !

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
