//@ts-check
const { expect } = require("chai")

const { pipeP, type, compose } = require("ramda")
const {
  addPrefix,
  addDelete,
  addInsert,
  addUpdate,
  queryToString,
  withGraph
} = require("../src/updater")

const { prepareBlaze } = require("../src")
const { SPARQL } = require("../src/sparql")

const { SELECT, UPDATE, blazeUri, deleteQuads, readQuads } = prepareBlaze() // use defaults

// test utilities
const expectToContain = str => result => expect(result).contains(str)
const expectType = t => result => expect(type(result) === t).to.be.true
const blazeTest = testname => /** @param {Promise} prom */ (prom, ...funs) =>
  it(testname, async () => pipeP(...funs)(await prom))

describe("blazegraph client", () => {
  it("should use proper default blazeUrl", () => {
    expect(blazeUri).equals("http://localhost:9999/bigdata/namespace/kb/sparql")
  })

  blazeTest("should support SPARQL: INSERT DATA")(
    UPDATE`
      prefix test: <http://example.com/>
      insert data { test:JohnDoe a test:Person }
    `,
    expectToContain("COMMIT")
  )

  blazeTest("should support SPARQL: DELETE DATA")(
    UPDATE`
      prefix test: <http://example.com/>
      delete data { test:JonDeleted a test:Person }
    `,
    expectToContain("COMMIT")
  )

  blazeTest("should support SPARQL: SELECT queries")(
    SELECT`
      prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      select * {
          ?s rdfs:label ?label
      } limit 10
    `,
    expectType("Array")
  )

  blazeTest("should support deleteQuads")(
    deleteQuads({
      subject: "<http://test#Person>",
      predicate: "<http://www.w3.org/2000/01/rdf-schema#label>",
      object: "\"Hello\""
    }),
    expectToContain("modified")
  )

  blazeTest("should support readQuads")(
    readQuads({
      predicate: "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>",
      object: "<http://example.com/Person>"
    }),
    expectType("Array")
  )
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
      addUpdate({ subject: ":s", predicate: ":p", object: ":o8" }),
      addUpdate({ subject: ":s", predicate: ":p", object: ":o9" }),
      addInsert({ subject: ":s", predicate: ":p", object: ":o1" }),
      addInsert({ subject: ":s", predicate: ":p", object: ":o2" }),
      addInsert({ subject: ":s", predicate: ":p", object: ":o3" }),
      addDelete({ subject: ":s", predicate: ":p", object: ":o2" })
    )()
  })
})
