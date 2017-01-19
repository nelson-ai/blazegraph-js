const methods = require('./middleware');
const sparqlUpdateQueryFactory = require('./sparqlUpdateQueryFactory');

const defaultOptions = {
  host: 'localhost',
  port: 9999,
  namespace: 'kb',
};

function getClient(options = {}) {
  // The "client" is just a collection of methods
  // with connection params passed as an URL
  const { host, port, namespace } = Object.assign({}, defaultOptions, options);
  const blazegraphUrl = `http://${host}:${port}/blazegraph/namespace/${namespace}/sparql`;
  const passUrl = fn => (...args) => fn(blazegraphUrl, ...args);

  const boundMethods = {};

  for (const methodName in methods) boundMethods[methodName] = passUrl(methods[methodName]);

  boundMethods.SparqlUpdateQuery = sparqlUpdateQueryFactory(boundMethods.updateSparql);

  return boundMethods;
}

module.exports = getClient;
