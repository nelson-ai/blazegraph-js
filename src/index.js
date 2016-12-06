const request = require('request');
const createRdfParser = require('n3').Parser;

const trigMimeType = 'application/x-trig; charset=utf-8';
const parser = createRdfParser({ format: 'N-Quads' });

/* ----------
    UTILS
---------- */

// Simple promise wrapper around the 'request' library
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => (error || response.statusCode !== 200 ? reject : resolve)(body || error));
  });
}

function rejectInput(input) {
  return Promise.reject(new Error(`Invalid input: ${JSON.stringify(input)}`));
}

// Validation functions
function isNotObject(input) {
  return !(input && typeof input === 'object');
}

function isValidString(value) {
  return value && typeof value === 'string';
}

function isNotFullStatement({ subject, predicate, object, graph }) {
  return !(isValidString(subject) && isValidString(predicate) && isValidString(object) && isValidString(graph));
}

// URI encodes a SPARQL query
function encodeQuery(query) {
  return encodeURIComponent(query.replace('\n', ' ').replace('\t', ''));
}

// URI encodes a quad (complete or not)
function encodeQuad({ subject, predicate, object, graph }) {
  let url = '';

  if (isValidString(subject)) url += `&s=${encodeURIComponent(subject)}`;
  if (isValidString(predicate)) url += `&p=${encodeURIComponent(predicate)}`;
  if (isValidString(object)) url += `&o=${encodeURIComponent(object)}`;
  if (isValidString(graph)) url += `&c=${encodeURIComponent(graph)}`;

  return url.slice(1);
}

// Serializes a quad into the trig format (has to be complete)
// NOTE: this middleware enforces the usage of named graph on every triple
function serializeQuad({ subject, predicate, object, graph }) {
  return `${graph} { ${subject} ${predicate} ${object} . }`;
}

/* ---------------
    MIDDLEWARE
--------------- */

/*
Read all quads matching a pattern
{
  subject?: <IRI>
  predicate?: <IRI>
  object?: <IRI> or "Literal"
  graph?: <IRI>
  graphs?: [<IRI>]
}
*/
function readQuads(blazegraphUrl, input) {
  if (isNotObject(input)) return rejectInput(input);

  let fullUrl = `${blazegraphUrl}?GETSTMTS&includeInferred=false&${encodeQuad(input)}`;

  if (Array.isArray(input.graphs)) input.graphs.forEach(g => fullUrl += `&c=${g}`);

  return makeRequest(fullUrl)
  .then(nquads => new Promise((resolve, reject) => {
    const quads = [];

    if (!nquads) return resolve(quads);

    parser.parse(nquads, (error, triple) => {
      if (error) return reject(error);
      if (triple) return quads.push(triple);

      resolve(quads);
    });
  }));
}

/*
Create one or more quads
{
  subject: <IRI>
  predicate: <IRI>
  object: <IRI> or "Literal"
  graph: <IRI>
}
Input can also be an array of quads
*/
function createQuads(blazegraphUrl, input) {
  const inputs = Array.isArray(input) ? input : [input];

  if (inputs.some(x => isNotObject(x) || isNotFullStatement(x))) return rejectInput(input);

  return makeRequest({
    url: blazegraphUrl,
    method: 'POST',
    headers: {
      'Content-Type': trigMimeType,
    },
    body: inputs.map(serializeQuad).join(''),
  });
}

/*
Update a quad knowing its old statement
{
  subject: <IRI>
  predicate: <IRI>
  object: <IRI> or "Literal", from the old statement
  newObject: <IRI> or "Literal", defines the new statement
  graph: <IRI>
}
*/
function updateQuad(blazegraphUrl, input) {
  if (isNotObject(input) || isNotFullStatement(input) || !isValidString(input.newObject)) return rejectInput(input);

  const oldQuad = serializeQuad(input);
  const newQuad = serializeQuad(Object.assign({}, input, { object: input.newObject }));
  const options = { contentType: trigMimeType };

  return makeRequest({
    url: `${blazegraphUrl}?updatePost`,
    method: 'POST',
    formData: {
      remove: {
        options,
        value: oldQuad,
      },
      add: {
        options,
        value: newQuad,
      },
    },
  });
}

// Perform a SPARQL update query
// NOTE: this does not allow to perform any SPARQL query
function updateSparql(blazegraphUrl, query) {
  if (!isValidString(query)) return Promise.reject(new Error('Query must be a non-empty string'));

  return makeRequest({
    url: `${blazegraphUrl}?update=${encodeQuery(query)}`,
    method: 'POST',
  });
}

/*
Delete all quads matching a pattern
{
  subject?: <IRI>
  predicate?: <IRI>
  object?: <IRI> or "Literal"
  graph?: <IRI>
}
*/
function deleteQuads(blazegraphUrl, input) {
  if (isNotObject(input)) return rejectInput(input);

  const params = encodeQuad(input);

  if (!params) throw new Error('You almost deleted the whole database!');

  return makeRequest({
    url: `${blazegraphUrl}?${params}`,
    method: 'DELETE',
  });
}

// Delete statements using a SPARQL CONSTRUCT or DESCRIBE query
// NOTE: this does not allow to perform any SPARQL query
function deleteSparql(blazegraphUrl, query) {
  if (!isValidString(query)) return Promise.reject(new Error('Query must be a non-empty string'));

  return makeRequest({
    url: `${blazegraphUrl}?query=${encodeQuery(query)}`,
    method: 'DELETE',
  });
}

module.exports = {
  readQuads,
  createQuads,
  updateQuad,
  updateSparql,
  deleteQuads,
  deleteSparql,
};
