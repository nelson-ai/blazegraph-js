const invariant = require('./utils/invariant');
const { isTriple, isDeleteTriple, isUpdateTriple } = require('./utils/isTriple');

module.exports = updateSparql => class SparqlUpdateQuery {

  // Works on a single graph for now
  constructor(prefixes, graphIri) {
    this.prefixes = prefixes || {};
    this.graphIri = graphIri;
    this.insertStatements = [];
    this.deleteStatements = [];
    this.whereStatements = [];
    // The following internal state justifies the usage of a class
    this.variableCounter = 0;
  }

  isEmpty() {
    return !(this.insertStatements.length || this.deleteStatements.length || this.whereStatements.length);
  }

  insert(triple) {
    invariant(isTriple(triple), `Invalid input: ${triple}`);

    this.insertStatements.push(triple);
  }

  delete(triple) {
    invariant(isDeleteTriple(triple), `Invalid input: ${triple}`);

    if (typeof triple.object !== 'string') {
      triple.object = `?x${this.variableCounter++}`;

      this.whereStatements.push(triple);
    }

    this.deleteStatements.push(triple);
  }

  update(triple) {
    invariant(isUpdateTriple(triple), `Invalid input: ${triple}`);

    this.insert(triple);
    this.delete(Object.assign({}, triple, { object: triple.oldObject }));
  }

  createQuery() {
    let prefixesClause = '';
    let whereClause = '';

    Object.keys(this.prefixes).forEach(prefix => {
      prefixesClause += `PREFIX ${prefix}: <${this.prefixes[prefix]}>\n`;
    });

    this.whereStatements.forEach(({ subject, predicate, object }) => {
      whereClause += `OPTIONAL { ${subject} ${predicate} ${object} }\n`;
    });

    // This weird formating allows better logging
    return `
${prefixesClause}${this.graphIri ? `WITH ${this.graphIri}` : ''}
DELETE {
${compactAndStringify(this.deleteStatements)}}
INSERT {
${compactAndStringify(this.insertStatements)}}
WHERE {
${whereClause}}`;
  }

  log(logFunction) {
    return (logFunction || console.log)(this.isEmpty() ? '[Empty SPARQL update query]' : this.createQuery());
  }

  execute() {
    return this.isEmpty() ? Promise.resolve() : updateSparql(this.createQuery());
  }
};

function compactAndStringify(triples) {
  const subjects = {};

  triples.forEach(({ subject, predicate, object }) => {
    if (!subjects[subject]) subjects[subject] = [];

    subjects[subject].push({ predicate, object });
  });

  let clause = ''; // Really a pattern or a template

  Object.keys(subjects).forEach(subject => {
    clause += `${subject} `;

    const l = subjects[subject].length - 1;

    subjects[subject].forEach(({ predicate, object }, i) => {
      clause += `${predicate} ${object} ${i === l ? '.' : ';'}\n`;
    });
  });

  return clause;
}
