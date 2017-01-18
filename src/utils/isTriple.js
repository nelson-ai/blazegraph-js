function isNonEmptyString(value) {
  return value && typeof value === 'string';
}

function isStringOrNil(value) {
  return isNonEmptyString(value)
  || typeof value === 'undefined'
  || value === null;
}

function isTriple(t) {
  return typeof t === 'object'
  && isNonEmptyString(t.subject)
  && isNonEmptyString(t.predicate)
  && isNonEmptyString(t.object);
}

function isDeleteTriple(t) {
  return typeof t === 'object'
  && isNonEmptyString(t.subject)
  && isNonEmptyString(t.predicate)
  && isStringOrNil(t.object);
}

function isUpdateTriple(t) {
  return isTriple(t)
  && isStringOrNil(t.oldObject);
}

function isQuad(q) {
  return isTriple(q)
  && isNonEmptyString(q.graph);
}

module.exports = {
  isTriple,
  isDeleteTriple,
  isUpdateTriple,
  isQuad,
};
