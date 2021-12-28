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
export declare const SPARQL: (str: TemplateStringsArray, ...vars: string[]) => string;
