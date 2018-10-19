const { compose, merge } = require('ramda');
const { SPARQL } = require('./sparql');
const {
  deleteSparql,
  querySparql,
  updateSparql,
  ...otherFun
} = require('./middleware');

const defaultOptions = {
  host: 'localhost',
  port: 9999,
  namespace: 'kb',
  blazename: 'bigdata', // it was 'blazegraph' before
};

const prepareBlazeUrl = compose(
  ({ host, port, namespace, blazename }) =>
    `http://${host}:${port}/${blazename}/namespace/${namespace}/sparql`,
  merge(defaultOptions),
  merge({})
);

// helper function that wraps other functons as template literals
const tmpl = fn => (str, ...vars) => fn(SPARQL(str, ...vars));

module.exports = {
  prepareBlazeUrl,
  SELECT: tmpl(querySparql),
  UPDATE: tmpl(updateSparql),
  DELETE: tmpl(deleteSparql),
  ...otherFun,
};
