// @ts-check
const { replace, compose, join, flatten, zip } = require("ramda")

// simple helper functions

const removeLeadingSpaces = replace(/^(\n| )+/g, "")
const removeTrailingSpaces = replace(/\n+ +/g, "\n")
const removeFinalNewline = replace(/\n$/, "")

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
 *
 * @param {string[]} str
 * @param {string[]} vars
 */
const SPARQL = (str, ...vars) =>
  // @ts-ignore because we have more than 6 arguments of the compose function
  compose(
    removeFinalNewline,
    removeTrailingSpaces,
    removeLeadingSpaces,
    join(""), // now just a string
    flatten, // now merged into a single array
    zip(str), // str and vars are arrays
    arr => [...arr, ""]
  )(vars)

module.exports = {
  SPARQL
}
