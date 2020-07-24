process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeAll(async function() {
  await db.query("DELETE FROM invoices;");
  await db.query("DELETE FROM companies;");
  await db.query("DELETE FROM industries;");
  await db.query("DELETE FROM companies_industries;");
})

beforeEach(async function() {
  let compResult = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('microsoft', 'Microsoft', 'Created windows.')
      RETURNING code, name, description`);

  testCompany = compResult.rows[0];

  let indResult = await db.query(`
    INSERT INTO
      industries (i_code, industry) VALUES ('int', 'Internet'),('tech', 'Technology')
      RETURNING i_code, industry`);

  let compIndResult = await db.query(`
    INSERT INTO
      companies_industries (comp_code, indust_code) VALUES ('microsoft', 'int'), ('microsoft', 'tech')
      RETURNING comp_code, indust_code`);  
});

afterEach(async function() {
  await db.query("DELETE FROM invoices;");
  await db.query("DELETE FROM companies;");
  await db.query("DELETE FROM industries;");
  await db.query("DELETE FROM companies_industries;");
  });
  
afterAll(async function() {
  await db.end();
});

describe("GET /companies", function() {
  test("Gets list of companies", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [{code: 'microsoft', name: 'Microsoft'}]
    });
  });
});  

describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const response = await request(app).get(`/companies/microsoft`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: {code: 'microsoft', 
                                name: 'Microsoft',
                                description: 'Created windows.',
                                industries: ['Internet', 'Technology']}});
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/twitter`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies", function() {
  test("Adds a new company", async function() {
    const data = {name: "Twitter", description: "Created tweets."}
    const response = await request(app).post('/companies').send(data);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {code: "twitter", name: "Twitter", description: "Created tweets."}
    });
  })  
})

describe("PUT /companies/:code", function() {
  test("Updates a single company", async function() {
    const response = await request(app)
      .put(`/companies/microsoft`)
      .send({
        name: "Microsoft-MSN",
        description: "The Microsoft browser."
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {code: "microsoft", name: "Microsoft-MSN", description: "The Microsoft browser."}
    });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).put(`/companies/ie`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", function() {
  test("Deletes a single company", async function() {
    const response = await request(app)
      .delete(`/companies/microsoft`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ message: "deleted" });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).delete(`/companies/ie`);
    expect(response.statusCode).toEqual(404);
  });
});