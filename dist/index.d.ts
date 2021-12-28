import { BlazegraphConfig } from "./types";
export declare const prepareBlaze: (userConfig?: Partial<BlazegraphConfig>) => {
    config: {
        port: number;
        hostname: string;
        namespace: string;
        blazename: string;
    };
    blazeUri: string;
    UPDATE: (str: TemplateStringsArray, ...vars: string[]) => Promise<import("./middleware").CommitStats>;
    DELETE: (str: TemplateStringsArray, ...vars: string[]) => Promise<Record<string, {
        type: string;
        value: string;
    }>[]>;
    /** Use as: SELECT`your sparql query` = querySparql without inferred triples. */
    SELECT: (str: TemplateStringsArray, ...vars: string[]) => Promise<Record<string, {
        type: string;
        value: string;
    }>[]>;
    /** Use as: SELECT`your sparql query` = querySparql with inferred triples.  */
    SELECTWI: (str: TemplateStringsArray, ...vars: string[]) => Promise<Record<string, {
        type: string;
        value: string;
    }>[]>;
    deleteSparql: (query: string) => Promise<Record<string, {
        type: string;
        value: string;
    }>[]>;
    querySparql: (query: string, withInferred?: boolean) => Promise<Record<string, {
        type: string;
        value: string;
    }>[]>;
    updateSparql: (query: string) => Promise<import("./middleware").CommitStats>;
    createQuads: (input: unknown) => Promise<string>;
    deleteQuads: (input: Partial<{
        object: string | import("n3").Literal;
        subject: string;
        predicate: string;
        graph: string;
    }>) => Promise<string>;
    readQuads: (input: {
        object?: string | import("n3").Literal | undefined;
        subject?: string | undefined;
        predicate?: string | undefined;
        graph?: string | undefined;
        graphs?: string[] | undefined;
    }, withInferred?: boolean) => Promise<import("n3").Quad[]>;
    updateQuad: (input: unknown) => Promise<string>;
    checkPatternExistence: (input: {
        object?: string | import("n3").Literal | undefined;
        subject?: string | undefined;
        predicate?: string | undefined;
        graph?: string | undefined;
        graphs?: string[] | undefined;
    }, withInferred?: boolean) => Promise<boolean>;
};
