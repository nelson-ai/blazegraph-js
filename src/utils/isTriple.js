function isStringOrNil(value) {
  return typeof value === 'string'
  || typeof value === 'undefined'
  || value === null;
}

function isTriple(t) {
  return typeof t === 'object'
  && typeof t.subject === 'string'
  && typeof t.predicate === 'string'
  && typeof t.object === 'string';
}

function isDeleteTriple(t) {
  return typeof t === 'object'
  && typeof t.subject === 'string'
  && typeof t.predicate === 'string'
  && isStringOrNil(t.object);
}

function isUpdateTriple(t) {
  return isTriple(t)
  && isStringOrNil(t.oldObject);
}

module.exports = {
  isTriple,
  isDeleteTriple,
  isUpdateTriple,
};
