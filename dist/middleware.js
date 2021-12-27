"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuads = exports.updateQuad = exports.createQuads = exports.readQuads = exports.checkPatternExistence = exports.deleteSparql = exports.updateSparql = exports.querySparql = void 0;
const ramda_1 = require("ramda");
const ts_invariant_1 = __importDefault(require("ts-invariant"));
const axios_1 = __importDefault(require("axios"));
const n3_1 = require("n3");
const types_1 = require("./types");
const zod_1 = require("zod");
const trigMimeType = "application/x-trig; charset=utf-8";
function makeRequest(options, resultSchema) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield (0, axios_1.default)(Object.assign(Object.assign({}, options), { validateStatus: status => status === 200 }));
        return resultSchema.parse(results.data);
    });
}
const encodeQuery = (0, ramda_1.compose)(encodeURIComponent, (0, ramda_1.replace)(/[\t ]+/g, " "), (0, ramda_1.replace)(/(^|\n)\s*#.*(\n|$)/g, ""));
function urlParam(name, val) {
    const strVal = String(val);
    return `${name}=${encodeURIComponent(strVal)}`;
}
const urlEncodePattern = (p) => {
    const list = [];
    if (p.subject)
        list.push(urlParam("s", p.subject));
    if (p.predicate)
        list.push(urlParam("p", p.predicate));
    if (p.object)
        list.push(urlParam("o", p.object));
    if (p.graph)
        list.push(urlParam("c", p.graph));
    return list.join("&");
};
const serializeTrig = ({ subject, predicate, object, graph }) => {
    const s = `${subject} ${predicate} ${object} .`;
    return graph ? `${graph} { ${s} }` : s;
};
const querySparql = (blazeUrl) => (query, withInferred = false) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield makeRequest({
        method: "GET",
        url: `${blazeUrl}?query=${encodeQuery(query)}&includeInferred=${withInferred}`,
        headers: { Accept: "application/json" }
    }, types_1.ZSparqlQueryResults);
    return data.results.bindings;
});
exports.querySparql = querySparql;
const parseKV = (input) => input
    .split(",")
    .map(x => x.split("="))
    .reduce((acc, cur) => {
    const [k, v] = cur;
    acc[k] = v;
    return acc;
}, {});
function parseCommitResults(result) {
    const [first, second] = Array.from(result.matchAll(/<p>(?<x>.*?)<\/p\s*>/g)).map(m => m[1]);
    return {
        query: parseKV(first),
        update: parseKV(second.replace(/^COMMIT:\s+/, ""))
    };
}
const updateSparql = (blazeUrl) => (query) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield makeRequest({
        method: "POST",
        url: `${blazeUrl}?update=${encodeQuery(query)}`,
        headers: { Accept: "application/json" },
    }, zod_1.z.string().nonempty());
    return parseCommitResults(result);
});
exports.updateSparql = updateSparql;
const deleteSparql = (blazeUrl) => (query) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield makeRequest({
        method: "DELETE",
        url: `${blazeUrl}?query=${encodeQuery(query)}`
    }, types_1.ZSparqlQueryResults);
    return data.results.bindings;
});
exports.deleteSparql = deleteSparql;
const ZCheckPatternExistenceResult = zod_1.z.string().nonempty();
const checkPatternExistence = (blazeUrl) => (input, withInferred = false) => __awaiter(void 0, void 0, void 0, function* () {
    const parse = types_1.ZPartialGraphPattern.parse(input);
    let fullUrl = `${blazeUrl}?HASSTMT&includeInferred=${withInferred}&${urlEncodePattern(parse)}`;
    if (Array.isArray(parse.graphs)) {
        for (const g of parse.graphs) {
            fullUrl += `&c=${g}`;
        }
    }
    const result = yield makeRequest({ url: fullUrl }, ZCheckPatternExistenceResult);
    const matched = /<data result="(\w*)"/.exec(result);
    if (matched === null)
        return false;
    return matched[1] === "true";
});
exports.checkPatternExistence = checkPatternExistence;
const readQuads = (blazeUrl) => (input, withInferred = false) => __awaiter(void 0, void 0, void 0, function* () {
    const parse = types_1.ZPartialGraphPattern.parse(input);
    let fullUrl = `${blazeUrl}?GETSTMTS&includeInferred=${withInferred}&${urlEncodePattern(parse)}`;
    if (Array.isArray(parse.graphs)) {
        for (const g of parse.graphs) {
            fullUrl += `&c=${g}`;
        }
    }
    const result = yield makeRequest({ url: fullUrl }, zod_1.z.string());
    if (result === "")
        return [];
    return new Promise((resolve, reject) => {
        const quads = [];
        const rdfParser = new n3_1.Parser();
        rdfParser.parse(result, (error, triple) => {
            if (error)
                return reject(error);
            if (triple)
                return quads.push(triple);
            resolve(quads);
        });
    });
});
exports.readQuads = readQuads;
const createQuads = (blazeUrl) => (input) => __awaiter(void 0, void 0, void 0, function* () {
    const inputs = Array.isArray(input) ? input : [input];
    const parse = types_1.ZQuadPattern.array().parse(inputs);
    return yield makeRequest({
        url: blazeUrl,
        method: "POST",
        headers: { "Content-Type": trigMimeType },
        data: parse.map(serializeTrig).join("")
    }, zod_1.z.string());
});
exports.createQuads = createQuads;
const updateQuad = (blazeUrl) => (input) => __awaiter(void 0, void 0, void 0, function* () {
    const parse = types_1.ZUpdateQuadPattern.parse(input);
    const oldQuad = serializeTrig(Object.assign(Object.assign({}, parse), { object: parse.oldObject }));
    const newQuad = serializeTrig(parse);
    const options = { contentType: trigMimeType };
    return yield makeRequest({
        url: `${blazeUrl}?updatePost`,
        method: "POST",
        data: {
            remove: { options, value: oldQuad },
            add: { options, value: newQuad }
        }
    }, zod_1.z.string());
});
exports.updateQuad = updateQuad;
const deleteQuads = (blazeUrl) => (input) => __awaiter(void 0, void 0, void 0, function* () {
    const parse = types_1.ZQuadPattern.partial().parse(input);
    const params = urlEncodePattern(parse);
    (0, ts_invariant_1.default)(params, "You almost deleted the whole database!");
    return yield makeRequest({
        method: "DELETE",
        url: `${blazeUrl}?${params}`
    }, zod_1.z.string());
});
exports.deleteQuads = deleteQuads;
