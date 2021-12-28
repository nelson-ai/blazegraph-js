import {IRI, TriplePattern} from "./schemas/types";
import {groupBy, juxt, pipe} from "ramda";
import {produce} from "immer";
import {Literal} from "n3";

// string generators
export const groupTriplesBySubject = groupBy<TriplePattern, string>(x => x.subject);

const compactAndStringifyTriples = (input: TriplePattern[] = []): string => {
  const grouped = groupTriplesBySubject(input);
  return Object.entries(grouped)
    .map(([subject, triples]) => `${subject} ${triples.map(({predicate, object}) => `${predicate} ${object}`).join("; ")}`)
    .join(" .\n");
}

function tripleToOptionStmt(item: TriplePattern): string {
  return `OPTIONAL { ${item.subject} ${item.predicate} ${item.object} }`;
}

function prefixesToStr({prefixes}: QueryObject): string {
  return Object.entries(prefixes)
    .map(([key, val]) => `PREFIX ${key}: <${val}>`)
    .join("\n");
}

function deleteStatementsToStr({deleteStatements}: QueryObject): string {
  const compactedTriples = compactAndStringifyTriples(deleteStatements);
  return `DELETE { ${compactedTriples} }`;
}

function insertStatementsToStr({insertStatements}: QueryObject): string {
  const compactedTriples = compactAndStringifyTriples(insertStatements);
  return `INSERT { ${compactedTriples} }`;
}

function whereStatementsToStr({whereStatements}: QueryObject): string | "" {
  return whereStatements.map(tripleToOptionStmt).join("\n");
}

function withGraphToStr({graphIri}: QueryObject): string {
  return graphIri ? `WITH ${graphIri}` : "";
}

// Public API

export function withGraph(iri: IRI): QueryObjectMapper {
  return produce(query => {
    query.graphIri = iri;
  });
}

export const addPrefix = (key: string, url: string): QueryObjectMapper => produce(query => {
  query.prefixes[key] = url;
});

export const addInsert = (triple: TriplePattern): QueryObjectMapper => produce(query => {
  query.insertStatements.push(triple);
});

export const addDelete = (triple: TriplePattern): QueryObjectMapper => produce(query => {
  if (!triple.object) {
    if (query.varSeq) query.varSeq++
    else query.varSeq = 1

    triple.object = `?x${query.varSeq}`
    query.whereStatements.push(triple);
  }

  query.deleteStatements.push(triple);
});

export const addUpdate = (triple: TriplePattern & { oldObject?: IRI | Literal }): QueryObjectMapper => pipe(
  addDelete({...triple, object: triple.oldObject ?? ""}),
  addInsert(triple),
);

const extractQueryPartsToStr = juxt([
  prefixesToStr,
  withGraphToStr,
  deleteStatementsToStr,
  insertStatementsToStr,
  whereStatementsToStr
]);

/** Converts query object into query string */
export const queryToString = (q: QueryObject): string =>
  extractQueryPartsToStr(q)
    .filter(x => x !== "")
    .join("\n");

type QueryObjectMapper = (query: QueryObject) => QueryObject;

interface QueryObject {
  varSeq: number;
  prefixes: Record<string, string>;
  graphIri: IRI;
  whereStatements: TriplePattern[];
  insertStatements: TriplePattern[];
  deleteStatements: TriplePattern[];
}

export function createEmptyQuery(): QueryObject {
  return {
    prefixes: {},
    insertStatements: [],
    whereStatements: [],
    graphIri: "",
    deleteStatements: [],
    varSeq: 0
  }
}
