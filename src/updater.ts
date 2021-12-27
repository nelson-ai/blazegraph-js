import {IRI} from "./types";
import {
  append,
  assoc,
  assocPath,
  complement,
  compose,
  filter,
  groupBy,
  isEmpty,
  isNil,
  join,
  juxt,
  lensProp,
  map,
  mapObjIndexed,
  over,
  prop,
  unless,
  values,
  when
} from "ramda";

// simple helper functions

const maybeEmptyList = when(isNil, () => []);
const prependStr = (prefix: string) => (original: string): string => `${prefix} ${original}`;
const addTripleAt = at => triple => over(lensProp(at), append(triple));

// string generators

const compactAndStringifyTriples = compose(
  join(" .\n"),
  values,
  mapObjIndexed((poList, subject) =>
    compose(
      prependStr(subject),
      join("; "),
      map(({predicate, object}) => `${predicate} ${object}`)
    )(poList)
  ),
  groupBy(prop("subject")),
  maybeEmptyList
)

const prefixesToStr = compose(
  join("\n"),
  values,
  mapObjIndexed((pval, pname) => `PREFIX ${pname}: <${pval}>`),
  prop("prefixes")
)

const deleteStatementsToStr = compose(
  unless(isEmpty, s => `DELETE { ${s} }`),
  compactAndStringifyTriples,
  prop("deleteStatements")
)

const insertStatementsToStr = compose(
  unless(isEmpty, s => `INSERT { ${s} }`),
  compactAndStringifyTriples,
  prop("insertStatements")
)

const whereStatementsToStr = compose(
  join("\n"),
  map(_ => `OPTIONAL { ${_.subject} ${_.predicate} ${_.object} }`),
  maybeEmptyList,
  prop("whereStatements")
)

const withGraphToStr = ({graphIri}: { graphIri: IRI }): string => (graphIri ? `WITH ${graphIri}` : "");

// Public API

export const withGraph = (iri: IRI) => assoc("graphIri", iri)
export const addPrefix = (key: string, url: string) => assocPath(["prefixes", key], url);
export const addInsert = addTripleAt("insertStatements")
export const addDelete = triple =>
  compose(
    addTripleAt("deleteStatements")(triple),
    q => {
      if (!triple.object) {
        if (q.varSeq) q.varSeq++
        else q.varSeq = 1

        triple.object = `?x${q.varSeq}`

        return addTripleAt("whereStatements")(triple)(q)
      }

      return q
    }
  );

export const addUpdate = triple =>
  compose(
    addInsert(triple),
    addDelete({...triple, object: triple.oldObject})
  );

/** Converts query object into query string */
export const queryToString = compose(
  join("\n"),
  filter(complement(isEmpty)), // only non-empty elements
  juxt([
    prefixesToStr,
    withGraphToStr,
    deleteStatementsToStr,
    insertStatementsToStr,
    whereStatementsToStr
  ])
);
