import {z} from "zod";

export type BindingResult = z.infer<typeof ZBindingResult>;
export const ZBindingResult = z.record(z.object({
  type: z.string(),
  value: z.string()
}));

const ZBindingVarName = z.string().nonempty();

export const ZSparqlQueryResult = z.object({
  head: z.object({
    vars: z.array(ZBindingVarName)
  }),
  results: z.object({
    bindings: z.array(ZBindingResult)
  })
});
