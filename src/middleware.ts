import {pipe, replace} from "ramda";
import invariant from "ts-invariant";
import axios, {AxiosRequestConfig} from "axios";
import {Literal, Parser, Quad} from "n3";
import {
  IRI,
  PartialGraphPattern,
  QuadPattern,
  UpdateQuadPattern,
  ZPartialGraphPattern,
  ZQuadPattern,
  ZUpdateQuadPattern
} from "./schemas/types";
import {z, ZodType} from "zod";
import {BindingResult, ZSparqlQueryResult} from "./schemas/ZSparqlQueryResult";
import {CheckPatternExistenceResult, ZCheckPatternExistenceResult} from "./schemas/ZCheckPatternExistenceResult";
import {CreateQuadsResult, ZCreateQuadsResult} from "./schemas/ZCreateQuadsResult";
import {UpdateQuadsResult, ZUpdateQuadsResult} from "./schemas/ZUpdateQuadsResult";
import {DeleteQuadsResult, ZDeleteQuadsResult} from "./schemas/ZDeleteQuadsResult";

const trigMimeType = "application/x-trig; charset=utf-8";

/**
 * Simple promise wrapper around the 'axios' library
 */
async function makeRequest<In, Def, Out>(options: AxiosRequestConfig, resultSchema: ZodType<Out, Def, In>): Promise<Out> {
  const results = await axios({
    ...options,
    validateStatus: status => status === 200
  });

  return resultSchema.parse(results.data);
}

const removeSingleLineComments = replace(/(^|\n)\s*#.*(\n|$)/g, "");
const removeLongSpaces = replace(/[\t ]+/g, " ");

const urlEncodeSparqlString = pipe(
  (x: IRI | Literal) => String(x), // TODO: is this really necessary?
  removeSingleLineComments,
  removeLongSpaces,
  encodeURIComponent,
)

function urlParam(name: string, val: IRI | Literal): string {
  const strVal = String(val);
  return `${name}=${encodeURIComponent(strVal)}`;
}

/** Encode a pattern into "s=...&p=..&o=...&c=..." */
const urlEncodePattern = (p: Partial<QuadPattern>) => {
  const list: string[] = [];

  if (p.subject) list.push(urlParam("s", p.subject));
  if (p.predicate) list.push(urlParam("p", p.predicate));
  if (p.object) list.push(urlParam("o", p.object));
  if (p.graph) list.push(urlParam("c", p.graph));

  return list.join("&");
}

/** Serializes a triple or quad into the trig format. */
const serializeTrig = ({subject, predicate, object, graph}: QuadPattern) => {
  const str = `${subject} ${predicate} ${object} .`
  return graph ? `${graph} { ${str} }` : str;
}

/* -----------
  MIDDLEWARE
----------- */

/**
 * Perform a SPARQL query
 * NOTE: this does not allow to perform a SPARQL update query
 */
export const querySparql = (blazeUrl: string) =>
  async (query: string, withInferred = false): Promise<BindingResult[]> => {
    const data = await makeRequest({
      method: "GET",
      url: `${blazeUrl}?query=${urlEncodeSparqlString(query)}&includeInferred=${withInferred}`,
      headers: {Accept: "application/json"}
    }, ZSparqlQueryResult);

    return data.results.bindings;
  };

const parseKV = (input: string): Record<string, string> =>
  input
    .split(",")
    .map(x => x.split("="))
    .reduce((acc, cur) => {
      const [k, v] = cur;
      acc[k] = v;
      return acc;
    }, {} as Record<string, string>);

export interface CommitStats {
  query: Record<string, string>;
  update: Record<string, string>;
}

function parseCommitResults(result: string): CommitStats {
  const [first, second] = Array.from(result.matchAll(/<p>(?<x>.*?)<\/p\s*>/g)).map(m => m[1]);

  return {
    query: parseKV(first),
    update: parseKV(second.replace(/^COMMIT:\s+/, ""))
  }
}

/**
 * Perform a SPARQL update, insert or delete.
 * NOTE: this does not allow to perform any other SPARQL query.
 * TODO: parse result as HTML and extract more parameters
 */
export const updateSparql = (blazeUrl: string) =>
  async (query: string): Promise<CommitStats> => {
    const result = await makeRequest({
      method: "POST",
      url: `${blazeUrl}?update=${urlEncodeSparqlString(query)}`,
      headers: {Accept: "application/json"},
    }, z.string().nonempty());

    return parseCommitResults(result);
  };

/**
 * Delete statements using a SPARQL CONSTRUCT or DESCRIBE query.
 * NOTE: this does not allow to perform any other SPARQL query.
 */
export const deleteSparql = (blazeUrl: string) =>
  async (query: string): Promise<BindingResult[]> => {
    const data = await makeRequest({
      method: "DELETE",
      url: `${blazeUrl}?query=${urlEncodeSparqlString(query)}`
    }, ZSparqlQueryResult);

    return data.results.bindings;
  };

/**
 * Returns true is some quads match a pattern.
 */
export const checkPatternExistence = (blazeUrl: string) =>
  async (input: PartialGraphPattern, withInferred = false): Promise<CheckPatternExistenceResult> => {
    const parse = ZPartialGraphPattern.parse(input);

    // TODO: simplify this block
    let fullUrl = `${blazeUrl}?HASSTMT&includeInferred=${withInferred}&${urlEncodePattern(parse)}`
    if (Array.isArray(parse.graphs)) {
      for (const g of parse.graphs) {
        fullUrl += `&c=${g}`;
      }
    }

    return await makeRequest({url: fullUrl}, ZCheckPatternExistenceResult);
  };

/** Read all quads matching a pattern. */
export const readQuads = (blazeUrl: string) =>
  async (input: PartialGraphPattern, withInferred = false): Promise<Quad[]> => {
    const parse = ZPartialGraphPattern.parse(input);

    // TODO: simplify this block
    let fullUrl = `${blazeUrl}?GETSTMTS&includeInferred=${withInferred}&${urlEncodePattern(parse)}`
    if (Array.isArray(parse.graphs)) {
      for (const g of parse.graphs) {
        fullUrl += `&c=${g}`;
      }
    }

    const result = await makeRequest({url: fullUrl}, z.string());
    if (result === "") return [];

    // The n3 parser uses a call back for parsing the results.
    // We need to transform it to a promise-based API.
    return new Promise<Quad[]>(
      (resolve, reject) => {
        const quads: Quad[] = []; // filled by the parser

        const rdfParser = new Parser();
        rdfParser.parse(result, (error, triple) => {
          if (error) return reject(error);
          if (triple) return quads.push(triple);

          resolve(quads);
        })
      }
    );
  }

/** Create one or more quads. */
export const createQuads = (blazeUrl: string) =>
  async (input: QuadPattern | QuadPattern[]): Promise<CreateQuadsResult> => {
    const inputs = Array.isArray(input) ? input : [input];
    const parse = ZQuadPattern.array().parse(inputs);

    return await makeRequest({
      url: blazeUrl,
      method: "POST",
      headers: {"Content-Type": trigMimeType},
      data: parse.map(serializeTrig).join("")
    }, ZCreateQuadsResult);
  };

/** Update a quad knowing its old statement. */
export const updateQuad = (blazeUrl: string) =>
  async (input: UpdateQuadPattern | unknown): Promise<UpdateQuadsResult> => {
    const parse = ZUpdateQuadPattern.parse(input); // TODO: do we need to check the input at runtime ?

    const oldQuad = serializeTrig({...parse, object: parse.oldObject})
    const newQuad = serializeTrig(parse);
    const options = {contentType: trigMimeType}

    return await makeRequest({
      url: `${blazeUrl}?updatePost`,
      method: "POST",
      data: {
        remove: {options, value: oldQuad},
        add: {options, value: newQuad}
      }
    }, ZUpdateQuadsResult);
  };


/** Delete all quads matching a pattern. */
export const deleteQuads = (blazeUrl: string) =>
  async (input: Partial<QuadPattern>): Promise<DeleteQuadsResult> => {
    const parse = ZQuadPattern.partial().parse(input);

    const params = urlEncodePattern(parse);
    invariant(params, "You almost deleted the whole database!");

    return await makeRequest({
      method: "DELETE",
      url: `${blazeUrl}?${params}`
    }, ZDeleteQuadsResult);
  }
