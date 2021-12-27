import { Literal } from "n3";
import { z } from "zod";
export declare type IRI = z.infer<typeof IRI>;
export declare const IRI: z.ZodString;
export declare const ZLiteral: z.ZodType<Literal, z.ZodTypeDef, Literal>;
export declare type BindingResult = z.infer<typeof ZBindingResult>;
export declare const ZBindingResult: z.ZodRecord<z.ZodString, z.ZodObject<{
    type: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    value: string;
}, {
    type: string;
    value: string;
}>>;
export declare const ZSparqlQueryResults: z.ZodObject<{
    head: z.ZodObject<{
        vars: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        vars: string[];
    }, {
        vars: string[];
    }>;
    results: z.ZodObject<{
        bindings: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            value: string;
        }, {
            type: string;
            value: string;
        }>>, "many">;
    }, "strip", z.ZodTypeAny, {
        bindings: Record<string, {
            type: string;
            value: string;
        }>[];
    }, {
        bindings: Record<string, {
            type: string;
            value: string;
        }>[];
    }>;
}, "strip", z.ZodTypeAny, {
    head: {
        vars: string[];
    };
    results: {
        bindings: Record<string, {
            type: string;
            value: string;
        }>[];
    };
}, {
    head: {
        vars: string[];
    };
    results: {
        bindings: Record<string, {
            type: string;
            value: string;
        }>[];
    };
}>;
export declare type BlazegraphConfig = z.infer<typeof ZBlazegraphConfig>;
export declare const ZBlazegraphConfig: z.ZodObject<{
    hostname: z.ZodString;
    port: z.ZodNumber;
    namespace: z.ZodString;
    blazename: z.ZodString;
}, "strip", z.ZodTypeAny, {
    port: number;
    hostname: string;
    namespace: string;
    blazename: string;
}, {
    port: number;
    hostname: string;
    namespace: string;
    blazename: string;
}>;
export declare type TriplePattern = z.infer<typeof ZTriplePattern>;
export declare const ZTriplePattern: z.ZodObject<{
    subject: z.ZodString;
    predicate: z.ZodString;
    object: z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>;
}, "strip", z.ZodTypeAny, {
    object: string | Literal;
    subject: string;
    predicate: string;
}, {
    object: string | Literal;
    subject: string;
    predicate: string;
}>;
export declare type DeleteTriplePattern = z.infer<typeof ZDeleteTriplePattern>;
export declare const ZDeleteTriplePattern: z.ZodObject<{
    subject: z.ZodString;
    predicate: z.ZodString;
    object: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>>;
}, "strip", z.ZodTypeAny, {
    object?: string | Literal | undefined;
    subject: string;
    predicate: string;
}, {
    object?: string | Literal | undefined;
    subject: string;
    predicate: string;
}>;
export declare type QuadPattern = z.infer<typeof ZQuadPattern>;
export declare const ZQuadPattern: z.ZodObject<z.extendShape<{
    subject: z.ZodString;
    predicate: z.ZodString;
    object: z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>;
}, {
    graph: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    object: string | Literal;
    subject: string;
    predicate: string;
    graph: string;
}, {
    object: string | Literal;
    subject: string;
    predicate: string;
    graph: string;
}>;
export declare type UpdateTriplePattern = z.infer<typeof ZUpdateTriplePattern>;
export declare const ZUpdateTriplePattern: z.ZodObject<z.extendShape<{
    subject: z.ZodString;
    predicate: z.ZodString;
    object: z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>;
}, {
    oldObject: z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>;
}>, "strip", z.ZodTypeAny, {
    object: string | Literal;
    subject: string;
    predicate: string;
    oldObject: string | Literal;
}, {
    object: string | Literal;
    subject: string;
    predicate: string;
    oldObject: string | Literal;
}>;
export declare type UpdateQuadPattern = z.infer<typeof ZUpdateQuadPattern>;
export declare const ZUpdateQuadPattern: z.ZodObject<z.extendShape<z.extendShape<{
    subject: z.ZodString;
    predicate: z.ZodString;
    object: z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>;
}, {
    graph: z.ZodString;
}>, {
    oldObject: z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>;
}>, "strip", z.ZodTypeAny, {
    object: string | Literal;
    subject: string;
    predicate: string;
    graph: string;
    oldObject: string | Literal;
}, {
    object: string | Literal;
    subject: string;
    predicate: string;
    graph: string;
    oldObject: string | Literal;
}>;
export declare type PartialGraphPattern = z.infer<typeof ZPartialGraphPattern>;
export declare const ZPartialGraphPattern: z.ZodObject<{
    object: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodType<Literal, z.ZodTypeDef, Literal>]>>;
    subject: z.ZodOptional<z.ZodString>;
    predicate: z.ZodOptional<z.ZodString>;
    graph: z.ZodOptional<z.ZodString>;
    graphs: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    object?: string | Literal | undefined;
    subject?: string | undefined;
    predicate?: string | undefined;
    graph?: string | undefined;
    graphs?: string[] | undefined;
}, {
    object?: string | Literal | undefined;
    subject?: string | undefined;
    predicate?: string | undefined;
    graph?: string | undefined;
    graphs?: string[] | undefined;
}>;
export declare const ZValidQuery: z.ZodString;
