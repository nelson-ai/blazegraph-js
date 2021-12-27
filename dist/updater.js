"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryToString = exports.addUpdate = exports.addDelete = exports.addInsert = exports.addPrefix = exports.withGraph = void 0;
const ramda_1 = require("ramda");
const maybeEmptyList = (0, ramda_1.when)(ramda_1.isNil, () => []);
const prependStr = (prefix) => (original) => `${prefix} ${original}`;
const addTripleAt = at => triple => (0, ramda_1.over)((0, ramda_1.lensProp)(at), (0, ramda_1.append)(triple));
const compactAndStringifyTriples = (0, ramda_1.compose)((0, ramda_1.join)(" .\n"), ramda_1.values, (0, ramda_1.mapObjIndexed)((poList, subject) => (0, ramda_1.compose)(prependStr(subject), (0, ramda_1.join)("; "), (0, ramda_1.map)(({ predicate, object }) => `${predicate} ${object}`))(poList)), (0, ramda_1.groupBy)((0, ramda_1.prop)("subject")), maybeEmptyList);
const prefixesToStr = (0, ramda_1.compose)((0, ramda_1.join)("\n"), ramda_1.values, (0, ramda_1.mapObjIndexed)((pval, pname) => `PREFIX ${pname}: <${pval}>`), (0, ramda_1.prop)("prefixes"));
const deleteStatementsToStr = (0, ramda_1.compose)((0, ramda_1.unless)(ramda_1.isEmpty, s => `DELETE { ${s} }`), compactAndStringifyTriples, (0, ramda_1.prop)("deleteStatements"));
const insertStatementsToStr = (0, ramda_1.compose)((0, ramda_1.unless)(ramda_1.isEmpty, s => `INSERT { ${s} }`), compactAndStringifyTriples, (0, ramda_1.prop)("insertStatements"));
const whereStatementsToStr = (0, ramda_1.compose)((0, ramda_1.join)("\n"), (0, ramda_1.map)(_ => `OPTIONAL { ${_.subject} ${_.predicate} ${_.object} }`), maybeEmptyList, (0, ramda_1.prop)("whereStatements"));
const withGraphToStr = ({ graphIri }) => (graphIri ? `WITH ${graphIri}` : "");
const withGraph = (iri) => (0, ramda_1.assoc)("graphIri", iri);
exports.withGraph = withGraph;
const addPrefix = (key, url) => (0, ramda_1.assocPath)(["prefixes", key], url);
exports.addPrefix = addPrefix;
exports.addInsert = addTripleAt("insertStatements");
const addDelete = triple => (0, ramda_1.compose)(addTripleAt("deleteStatements")(triple), q => {
    if (!triple.object) {
        if (q.varSeq)
            q.varSeq++;
        else
            q.varSeq = 1;
        triple.object = `?x${q.varSeq}`;
        return addTripleAt("whereStatements")(triple)(q);
    }
    return q;
});
exports.addDelete = addDelete;
const addUpdate = triple => (0, ramda_1.compose)((0, exports.addInsert)(triple), (0, exports.addDelete)(Object.assign(Object.assign({}, triple), { object: triple.oldObject })));
exports.addUpdate = addUpdate;
exports.queryToString = (0, ramda_1.compose)((0, ramda_1.join)("\n"), (0, ramda_1.filter)((0, ramda_1.complement)(ramda_1.isEmpty)), (0, ramda_1.juxt)([
    prefixesToStr,
    withGraphToStr,
    deleteStatementsToStr,
    insertStatementsToStr,
    whereStatementsToStr
]));
