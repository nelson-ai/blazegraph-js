import { Quad } from "n3";
import { BindingResult, PartialGraphPattern, QuadPattern, UpdateQuadPattern } from "./types";
/**
 * Perform a SPARQL query
 * NOTE: this does not allow to perform a SPARQL update query
 */
export declare const querySparql: (blazeUrl: string) => (query: string, withInferred?: boolean) => Promise<BindingResult[]>;
export interface CommitStats {
    query: Record<string, string>;
    update: Record<string, string>;
}
/**
 * Perform a SPARQL update, insert or delete.
 * NOTE: this does not allow to perform any other SPARQL query.
 * TODO: parse result as HTML and extract more parameters
 */
export declare const updateSparql: (blazeUrl: string) => (query: string) => Promise<CommitStats>;
/**
 * Delete statements using a SPARQL CONSTRUCT or DESCRIBE query.
 * NOTE: this does not allow to perform any other SPARQL query.
 * TODO: this function has never been tested
 */
export declare const deleteSparql: (blazeUrl: string) => (query: string) => Promise<BindingResult[]>;
/**
 * Returns true is some quads match a pattern.
 */
export declare const checkPatternExistence: (blazeUrl: string) => (input: PartialGraphPattern, withInferred?: boolean) => Promise<boolean>;
/** Read all quads matching a pattern. */
export declare const readQuads: (blazeUrl: string) => (input: PartialGraphPattern, withInferred?: boolean) => Promise<Quad[]>;
/** Create one or more quads. */
export declare const createQuads: (blazeUrl: string) => (input: QuadPattern | unknown | (QuadPattern | unknown)[]) => Promise<string>;
/** Update a quad knowing its old statement. */
export declare const updateQuad: (blazeUrl: string) => (input: UpdateQuadPattern | unknown) => Promise<string>;
/** Delete all quads matching a pattern. */
export declare const deleteQuads: (blazeUrl: string) => (input: Partial<QuadPattern>) => Promise<string>;
