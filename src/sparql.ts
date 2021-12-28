import {zip} from "ramda";

/**
 * Formats SPARQL code by removing leading spaces from each line.
 *
 * This function is pure.
 * @author Viliam Simko
 *
 * @example
 *   const q = SPARQL`
 *     select * from {?s ?p ?o}
 *   `
 *   console.log(q) // -> "select * from {?s ?p ?o}"
 */
export const SPARQL = (str: TemplateStringsArray, ...vars: string[]): string => {
  return zip(str, [...vars, ""])
    .flat()
    .join("")
    .replace(/^([\n ])+/g, "") // leading space
    .replace(/\n+ +/g, "\n") // trailing space
    .replace(/\n$/, ""); // final newline
}
