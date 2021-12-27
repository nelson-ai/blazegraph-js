import {Literal} from "n3";
import {z} from "zod";

export type IRI = z.infer<typeof IRI>;
export const IRI = z.string().nonempty("IRI cannot be empty string");
export const ZLiteral = z.instanceof(Literal);

export type BindingResult = z.infer<typeof ZBindingResult>;
export const ZBindingResult = z.record(z.object({
  type: z.string(),
  value: z.string()
}));

const ZBindingVarName = z.string().nonempty();
export const ZSparqlQueryResults = z.object({
  head: z.object({
    vars: z.array(ZBindingVarName)
  }),
  results: z.object({
    bindings: z.array(ZBindingResult)
  })
});

export type BlazegraphConfig = z.infer<typeof ZBlazegraphConfig>;
export const ZBlazegraphConfig = z.object({
  hostname: z.string(),
  port: z.number().int().min(1000).max(30000), // TODO: other ports ?
  namespace: z.string(),
  blazename: z.string(),
})


export type TriplePattern = z.infer<typeof ZTriplePattern>;
export const ZTriplePattern = z.object({
  subject: IRI,
  predicate: IRI,
  object: z.union([IRI, ZLiteral])
});

export type DeleteTriplePattern = z.infer<typeof ZDeleteTriplePattern>;
export const ZDeleteTriplePattern = z.object({
  subject: IRI,
  predicate: IRI,
  object: z.union([IRI, ZLiteral]).optional()
});


export type QuadPattern = z.infer<typeof ZQuadPattern>;
export const ZQuadPattern = ZTriplePattern.extend({
  graph: IRI
});

export type UpdateTriplePattern = z.infer<typeof ZUpdateTriplePattern>;
export const ZUpdateTriplePattern = ZTriplePattern.extend({
  oldObject: z.union([IRI, ZLiteral])
});

export type UpdateQuadPattern = z.infer<typeof ZUpdateQuadPattern>;
export const ZUpdateQuadPattern = ZQuadPattern.extend({
  oldObject: z.union([IRI, ZLiteral])
})

export type PartialGraphPattern = z.infer<typeof ZPartialGraphPattern>;
export const ZPartialGraphPattern = ZQuadPattern.extend({
  graphs: IRI.array().optional()
}).partial();

export const ZValidQuery = z.string().nonempty("Query must be a non-empty string");
