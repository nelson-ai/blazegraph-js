import {z} from "zod";

export type CreateQuadsResult = z.infer<typeof ZCreateQuadsResult>;
export const ZCreateQuadsResult = z.string().nonempty().transform(input => {
  return input; // TODO
})
