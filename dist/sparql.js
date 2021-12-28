"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPARQL = void 0;
const ramda_1 = require("ramda");
// simple helper functions
const removeLeadingSpaces = (0, ramda_1.replace)(/^([\n ])+/g, "");
const removeTrailingSpaces = (0, ramda_1.replace)(/\n+ +/g, "\n");
const removeFinalNewline = (0, ramda_1.replace)(/\n$/, "");
// Public API
/**
 * String interpolation function that formats
 * SPARQL code by removing leading spaces from each line.
 * This function is pure.
 * @author Viliam Simko
 * @example
 *   const q = SPARQL`
 *     select * from {?s ?p ?o}
 *   `
 *   console.log(q) // -> "select * from {?s ?p ?o}"
 */
const SPARQL = (str, ...vars) => (0, ramda_1.compose)(removeFinalNewline, removeTrailingSpaces, removeLeadingSpaces, (0, ramda_1.join)(""), // now just a string
ramda_1.flatten, // now merged into a single array
(0, ramda_1.zip)(str), // str and vars are arrays
// str and vars are arrays
arr => [...arr, ""])(vars);
exports.SPARQL = SPARQL;
