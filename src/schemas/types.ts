import {Literal} from "n3";
import {z} from "zod";

export type IRI = z.infer<typeof IRI>;
export const IRI = z.string().nonempty("IRI cannot be empty string");
export const ZLiteral = z.instanceof(Literal);

export type BlazegraphConfig = z.infer<typeof ZBlazegraphConfig>;
export const ZBlazegraphConfig = z.object({
  hostname: z.string().nonempty(),
  port: z.number().int().min(1000).max(60000),
  namespace: z.string().nonempty(),
  blazename: z.string().nonempty(),
})


export type TriplePattern = z.infer<typeof ZTriplePattern>;
export const ZTriplePattern = z.object({
  subject: IRI,
  predicate: IRI,
  object: z.union([IRI, ZLiteral])
});

export type QuadPattern = z.infer<typeof ZQuadPattern>;
export const ZQuadPattern = ZTriplePattern.extend({
  graph: IRI
});

export type UpdateQuadPattern = z.infer<typeof ZUpdateQuadPattern>;
export const ZUpdateQuadPattern = ZQuadPattern.extend({
  oldObject: z.union([IRI, ZLiteral])
})

export type PartialGraphPattern = z.infer<typeof ZPartialGraphPattern>;
export const ZPartialGraphPattern = ZQuadPattern.extend({
  graphs: IRI.array().optional()
}).partial();
