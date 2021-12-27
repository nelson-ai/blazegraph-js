"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareBlaze = void 0;
const ramda_1 = require("ramda");
const sparql_1 = require("./sparql");
const middleware_1 = require("./middleware");
const types_1 = require("./types");
const defaultConfig = {
    hostname: "localhost",
    port: 9999,
    namespace: "kb",
    blazename: "bigdata"
};
const tmpl = (fn) => (str, ...vars) => {
    const sparql = (0, sparql_1.SPARQL)(str, ...vars);
    return fn(sparql);
};
const prepareBlaze = (userConfig = {}) => {
    const config = types_1.ZBlazegraphConfig.parse((0, ramda_1.merge)(defaultConfig, userConfig));
    const { hostname, port, blazename, namespace } = config;
    const blazeUri = `http://${hostname}:${port}/${blazename}/namespace/${namespace}/sparql`;
    return {
        config,
        blazeUri,
        UPDATE: tmpl((0, middleware_1.updateSparql)(blazeUri)),
        DELETE: tmpl((0, middleware_1.deleteSparql)(blazeUri)),
        SELECT: tmpl((0, middleware_1.querySparql)(blazeUri)),
        SELECTWI: tmpl(str => (0, middleware_1.querySparql)(blazeUri)(str, true)),
        deleteSparql: (0, middleware_1.deleteSparql)(blazeUri),
        querySparql: (0, middleware_1.querySparql)(blazeUri),
        updateSparql: (0, middleware_1.updateSparql)(blazeUri),
        createQuads: (0, middleware_1.createQuads)(blazeUri),
        deleteQuads: (0, middleware_1.deleteQuads)(blazeUri),
        readQuads: (0, middleware_1.readQuads)(blazeUri),
        updateQuad: (0, middleware_1.updateQuad)(blazeUri),
        checkPatternExistence: (0, middleware_1.checkPatternExistence)(blazeUri)
    };
};
exports.prepareBlaze = prepareBlaze;
