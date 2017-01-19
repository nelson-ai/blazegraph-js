const request = require('request');
const createRdfParser = require('n3').Parser;
const { isNonEmptyString, isQuad, isUpdateQuad, isPattern } = require('./utils/validation');

const trigMimeType = 'application/x-trig; charset=utf-8';

/* ------
  UTILS
------ */

// Simple promise wrapper around the 'request' library
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => (error || response.statusCode !== 200 ? reject : resolve)(body || error));
  });
}

function rejectInput(input) {
  const error = new Error(`Invalid input: ${JSON.stringify(input)}`);
  // Remove this function's frame from the stack
  Error.captureStackTrace(error, rejectInput);

  return Promise.reject(error);
}

// URI encodes a SPARQL query
function encodeQuery(query) {
  return encodeURIComponent(query.replace('\n', ' ').replace('\t', ''));
}

// URI encodes a pattern
function encodePattern({ subject, predicate, object, graph }) {
  let url = '';

  if (subject) url += `&s=${encodeURIComponent(subject)}`;
  if (predicate) url += `&p=${encodeURIComponent(predicate)}`;
  if (object) url += `&o=${encodeURIComponent(object)}`;
  if (graph) url += `&c=${encodeURIComponent(graph)}`;

  return url.slice(1);
}

// Serializes a triple or quad into the trig format
function serializeTrig({ subject, predicate, object, graph }) {
  const s = `${subject} ${predicate} ${object} .`;

  return graph ? `${graph} { ${s} }` : s;
}

/* -----------
  MIDDLEWARE
----------- */

// Perform a SPARQL query
// NOTE: this does not allow to perform a SPARQL update query
function querySparql(blazegraphUrl, query, includeInferred = false) {
  if (!isNonEmptyString(query)) return Promise.reject(new Error('Query must be a non-empty string'));

  return makeRequest({
    url: `${blazegraphUrl}?query=${encodeQuery(query)}&includeInferred=${!!includeInferred}`,
    headers: {
      Accept: 'application/json',
    },
  })
  .then(body => {
    if (typeof body !== 'string') throw new Error('TODO: Learn when this is possible');

    // Can throw ? Can be something else ?
    return JSON.parse(body).results.bindings;
  });
}

// Perform a SPARQL update query
// NOTE: this does not allow to perform any other SPARQL query
function updateSparql(blazegraphUrl, query) {
  if (!isNonEmptyString(query)) return Promise.reject(new Error('Query must be a non-empty string'));

  return makeRequest({
    url: `${blazegraphUrl}?update=${encodeQuery(query)}`,
    method: 'POST',
  });
}

// Delete statements using a SPARQL CONSTRUCT or DESCRIBE query
// NOTE: this does not allow to perform any other SPARQL query
function deleteSparql(blazegraphUrl, query) {
  if (!isNonEmptyString(query)) return Promise.reject(new Error('Query must be a non-empty string'));

  return makeRequest({
    url: `${blazegraphUrl}?query=${encodeQuery(query)}`,
    method: 'DELETE',
  });
}

/*
Returns true is some quads match a pattern
{
  subject?: <IRI>
  predicate?: <IRI>
  object?: <IRI> or "Literal"
  graph?: <IRI>
  graphs?: [<IRI>]
}
*/
function checkPatternExistence(blazegraphUrl, input, includeInferred = false) {
  if (!isPattern(input)) return rejectInput(input);

  let fullUrl = `${blazegraphUrl}?HASSTMT&includeInferred=${!!includeInferred}&${encodePattern(input)}`;

  if (Array.isArray(input.graphs)) input.graphs.forEach(g => fullUrl += `&c=${g}`);

  return makeRequest(fullUrl)
  .then(result => isNonEmptyString(result) && /<data result="(\w*)"/.exec(result)[1] === 'true');
}

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
function readQuads(blazegraphUrl, input, includeInferred = false) {
  if (!isPattern(input)) return rejectInput(input);

  let fullUrl = `${blazegraphUrl}?GETSTMTS&includeInferred=${!!includeInferred}&${encodePattern(input)}`;

  if (Array.isArray(input.graphs)) input.graphs.forEach(g => fullUrl += `&c=${g}`);

  return makeRequest(fullUrl)
  .then(nquads => new Promise((resolve, reject) => {
    const quads = [];

    if (!nquads) return resolve(quads);

    createRdfParser().parse(nquads, (error, triple) => {
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
  graph?: <IRI>
}
Input can also be an array of quads
*/
function createQuads(blazegraphUrl, input) {
  const inputs = Array.isArray(input) ? input : [input];

  if (inputs.some(quad => !isQuad(quad))) return rejectInput(input);

  return makeRequest({
    url: blazegraphUrl,
    method: 'POST',
    headers: {
      'Content-Type': trigMimeType,
    },
    body: inputs.map(serializeTrig).join(''),
  });
}

/*
Update a quad knowing its old statement
{
  subject: <IRI>
  predicate: <IRI>
  oldObject: <IRI> or "Literal", from the old statement
  object: <IRI> or "Literal", defines the new statement
  graph?: <IRI>
}
*/
function updateQuad(blazegraphUrl, input) {
  if (!isUpdateQuad(input)) return rejectInput(input);

  const oldQuad = serializeTrig(Object.assign({}, input, { object: input.oldObject }));
  const newQuad = serializeTrig(input);
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
  if (!isPattern(input)) return rejectInput(input);

  const params = encodePattern(input);

  if (!params) throw new Error('You almost deleted the whole database!');

  return makeRequest({
    url: `${blazegraphUrl}?${params}`,
    method: 'DELETE',
  });
}

module.exports = {
  querySparql,
  checkPatternExistence,
  readQuads,
  createQuads,
  updateQuad,
  updateSparql,
  deleteQuads,
  deleteSparql,
};
