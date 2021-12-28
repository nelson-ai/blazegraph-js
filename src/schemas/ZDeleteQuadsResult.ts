import {z} from "zod";

export interface ParsedStats {
  modified: number;
  milliseconds: number;
}

export type DeleteQuadsResult = z.infer<typeof ZDeleteQuadsResult>;
export const ZDeleteQuadsResult = z.string().nonempty().transform((input): ParsedStats | null => {
  const iterable = input.matchAll(/<\?xml version="1.0"\?><data modified="(?<modified>.*?)" milliseconds="(?<milliseconds>.*?)"\/>/);
  const groups = Array.from(iterable)[0].groups;
  if (groups === undefined) return null;

  return {
    milliseconds: Number(groups.milliseconds),
    modified: Number(groups.modified)
  };
});
