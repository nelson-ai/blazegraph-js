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
  && isStringOrNil(t.oldObject); // !
}

function isQuad(q) {
  return isTriple(q)
  && isStringOrNil(q.graph);
}

function isUpdateQuad(q) {
  return isQuad(q)
  && isNonEmptyString(q.oldObject); // !
}

function isPattern(p) {
  return typeof p === 'object'
  && isStringOrNil(p.subject)
  && isStringOrNil(p.predicate)
  && isStringOrNil(p.object)
  && isStringOrNil(p.graph);
}

module.exports = {
  isNonEmptyString,
  isStringOrNil,
  isTriple,
  isDeleteTriple,
  isUpdateTriple,
  isQuad,
  isUpdateQuad,
  isPattern,
};
