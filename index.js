const methods = require('./src');

const defaultOptions = {
  host: 'localhost',
  port: 9999,
  namespace: 'kb',
};

function getClient(options = defaultOptions) {
  const { host, port, namespace } = options;
  const blazegraphUrl = `http://${host}:${port}/blazegraph/namespace/${namespace}/sparql`;
  const passUrl = fn => (...args) => fn(blazegraphUrl, ...args);

  const bindedMethods = {};

  for (const methodName in methods) bindedMethods[methodName] = passUrl(methods[methodName]);

  return bindedMethods;
}

module.exports = getClient;
