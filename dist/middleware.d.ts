import { Quad } from "n3";
import { BindingResult, PartialGraphPattern, QuadPattern, UpdateQuadPattern } from "./types";
export declare const querySparql: (blazeUrl: string) => (query: string, withInferred?: boolean) => Promise<BindingResult[]>;
export interface CommitStats {
    query: Record<string, string>;
    update: Record<string, string>;
}
export declare const updateSparql: (blazeUrl: string) => (query: string) => Promise<CommitStats>;
export declare const deleteSparql: (blazeUrl: string) => (query: string) => Promise<BindingResult[]>;
export declare const checkPatternExistence: (blazeUrl: string) => (input: PartialGraphPattern, withInferred?: boolean) => Promise<boolean>;
export declare const readQuads: (blazeUrl: string) => (input: PartialGraphPattern, withInferred?: boolean) => Promise<Quad[]>;
export declare const createQuads: (blazeUrl: string) => (input: QuadPattern | unknown | (QuadPattern | unknown)[]) => Promise<string>;
export declare const updateQuad: (blazeUrl: string) => (input: UpdateQuadPattern | unknown) => Promise<string>;
export declare const deleteQuads: (blazeUrl: string) => (input: Partial<QuadPattern>) => Promise<string>;
