"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZValidQuery = exports.ZPartialGraphPattern = exports.ZUpdateQuadPattern = exports.ZUpdateTriplePattern = exports.ZQuadPattern = exports.ZDeleteTriplePattern = exports.ZTriplePattern = exports.ZBlazegraphConfig = exports.ZSparqlQueryResults = exports.ZBindingResult = exports.ZLiteral = exports.IRI = void 0;
const n3_1 = require("n3");
const zod_1 = require("zod");
exports.IRI = zod_1.z.string().nonempty("IRI cannot be empty string");
exports.ZLiteral = zod_1.z.instanceof(n3_1.Literal);
exports.ZBindingResult = zod_1.z.record(zod_1.z.object({
    type: zod_1.z.string(),
    value: zod_1.z.string()
}));
const ZBindingVarName = zod_1.z.string().nonempty();
exports.ZSparqlQueryResults = zod_1.z.object({
    head: zod_1.z.object({
        vars: zod_1.z.array(ZBindingVarName)
    }),
    results: zod_1.z.object({
        bindings: zod_1.z.array(exports.ZBindingResult)
    })
});
exports.ZBlazegraphConfig = zod_1.z.object({
    hostname: zod_1.z.string(),
    port: zod_1.z.number().int().min(1000).max(30000),
    namespace: zod_1.z.string(),
    blazename: zod_1.z.string(),
});
exports.ZTriplePattern = zod_1.z.object({
    subject: exports.IRI,
    predicate: exports.IRI,
    object: zod_1.z.union([exports.IRI, exports.ZLiteral])
});
exports.ZDeleteTriplePattern = zod_1.z.object({
    subject: exports.IRI,
    predicate: exports.IRI,
    object: zod_1.z.union([exports.IRI, exports.ZLiteral]).optional()
});
exports.ZQuadPattern = exports.ZTriplePattern.extend({
    graph: exports.IRI
});
exports.ZUpdateTriplePattern = exports.ZTriplePattern.extend({
    oldObject: zod_1.z.union([exports.IRI, exports.ZLiteral])
});
exports.ZUpdateQuadPattern = exports.ZQuadPattern.extend({
    oldObject: zod_1.z.union([exports.IRI, exports.ZLiteral])
});
exports.ZPartialGraphPattern = exports.ZQuadPattern.extend({
    graphs: exports.IRI.array().optional()
}).partial();
exports.ZValidQuery = zod_1.z.string().nonempty("Query must be a non-empty string");
