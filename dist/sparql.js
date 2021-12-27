"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPARQL = void 0;
const ramda_1 = require("ramda");
const removeLeadingSpaces = (0, ramda_1.replace)(/^([\n ])+/g, "");
const removeTrailingSpaces = (0, ramda_1.replace)(/\n+ +/g, "\n");
const removeFinalNewline = (0, ramda_1.replace)(/\n$/, "");
const SPARQL = (str, ...vars) => (0, ramda_1.compose)(removeFinalNewline, removeTrailingSpaces, removeLeadingSpaces, (0, ramda_1.join)(""), ramda_1.flatten, (0, ramda_1.zip)(str), arr => [...arr, ""])(vars);
exports.SPARQL = SPARQL;
