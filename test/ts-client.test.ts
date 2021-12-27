// noinspection HttpUrlsUsage

import {expect, use as chaiUse} from "chai";
import chaiAsPromised from "chai-as-promised"

import {compose} from "ramda";
import {addDelete, addInsert, addPrefix, addUpdate, queryToString, withGraph} from "../src/updater";
import {prepareBlaze} from "../src";
import {SPARQL} from "../src/sparql";
import {TriplePattern} from "../src/types";

chaiUse(chaiAsPromised);

const {SELECT, UPDATE, blazeUri, deleteQuads, readQuads} = prepareBlaze(); // use defaults

// test utilities
const expectToContain = (str: string) => (result: string) => expect(result).contains(str);

describe("blazegraph client", () => {
  it("should use proper default blazeUrl", () => {
    expect(blazeUri).equals("http://localhost:9999/bigdata/namespace/kb/sparql")
  })

  it("should support SPARQL: INSERT DATA", async () => {
    const result = await UPDATE`
      prefix test: <http://example.com/>
      insert data { test:JohnDoe a test:Person }
    `;

    expect(result).has.keys("query", "update");
  });

  it("should support SPARQL: DELETE DATA", async () => {
    const result = await UPDATE`
      prefix test: <http://example.com/>
      delete data { test:JonDeleted a test:Person }
    `;

    expect(result).has.keys("query", "update");
  });

  it("should support SPARQL: SELECT queries", async () => {
    const result = await SELECT`
      prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      select * {
          ?s rdfs:label ?label
      } limit 10
    `;

    expect(Array.isArray(result)).is.true;
  });

  it("should be able to perform INSERT+SELECT", async () => {
    await UPDATE`
      prefix test: <http://example.com/>
      insert data { test:JohnDoe a test:Person }
    `;

    const result = await SELECT`
      prefix test: <http://example.com/>
      select * {
          ?s a test:Person
      } limit 10
    `;

    expect(result).to.have.deep.members([
      {
        s: {
          type: "uri",
          value: "http://example.com/JohnDoe"
        }
      }
    ]);
  });

  it("should support deleteQuads", async () => {
    const result = await deleteQuads({
      subject: "<http://test#Person>",
      predicate: "<http://www.w3.org/2000/01/rdf-schema#label>",
      object: "\"Hello\""
    });

    expect(result).contains("modified");
  })

  it("should reject invalid IRI", async () => {
    const validIRI = "<http://test#Person>";
    const invalidIRI = "";
    const tripleWithInvalidSubject: TriplePattern = {subject: invalidIRI, predicate: validIRI, object: validIRI};
    const tripleWithInvalidPredicate: TriplePattern = {subject: validIRI, predicate: invalidIRI, object: validIRI};
    const tripleWithInvalidObject: TriplePattern = {subject: validIRI, predicate: validIRI, object: invalidIRI};

    const promise1 = deleteQuads(tripleWithInvalidSubject);
    const promise2 = deleteQuads(tripleWithInvalidPredicate);
    const promise3 = deleteQuads(tripleWithInvalidObject);

    await expect(promise1).to.be.rejectedWith("IRI cannot be empty string");
    await expect(promise2).to.be.rejectedWith("IRI cannot be empty string");
    await expect(promise3).to.be.rejectedWith("IRI cannot be empty string");
  })

  it("should support readQuads", async () => {
    const result = await readQuads({
      predicate: "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>",
      object: "<http://example.com/Person>"
    });

    expect(Array.isArray(result)).is.true;
  })
})

describe("sparql builder", () => {
  it("can compose query", () => {
    compose(
      expectToContain(SPARQL`
        PREFIX rdf: <http://rdf>
        PREFIX rdfs: <http://rdfs>
        WITH http://mygraph
        DELETE { :s :p :o2; :p ?x1; :p ?x2 }
        INSERT { :s :p :o3; :p :o2; :p :o1; :p :o9; :p :o8 }
        OPTIONAL { :s :p ?x1 }
        OPTIONAL { :s :p ?x2 }
      `),
      queryToString,
      addPrefix("rdfs", "http://rdfs"),
      addPrefix("rdf", "http://rdf"),
      withGraph("http://mygraph"),
      addUpdate({subject: ":s", predicate: ":p", object: ":o8"}),
      addUpdate({subject: ":s", predicate: ":p", object: ":o9"}),
      addInsert({subject: ":s", predicate: ":p", object: ":o1"}),
      addInsert({subject: ":s", predicate: ":p", object: ":o2"}),
      addInsert({subject: ":s", predicate: ":p", object: ":o3"}),
      addDelete({subject: ":s", predicate: ":p", object: ":o2"})
    )()
  })
})
