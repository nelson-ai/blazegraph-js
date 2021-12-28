import {z} from "zod";

export type UpdateQuadsResult = z.infer<typeof ZUpdateQuadsResult>;
export const ZUpdateQuadsResult = z.string().nonempty().transform(input => {
  return input; // TODO
});
