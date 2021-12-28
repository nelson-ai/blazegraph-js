import {z} from "zod";

export type CheckPatternExistenceResult = z.infer<typeof ZCheckPatternExistenceResult>;
export const ZCheckPatternExistenceResult = z.string().nonempty().transform((x) => {
  const matched = /<data result="(\w*)"/.exec(x);
  if (matched === null) return false;

  return matched[1] === "true";
});
