process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('msf', 'Microsoft', 'Created windows.')
      RETURNING code, name, description`);
  testCompany = result.rows[0];
});

afterEach(async function() {
    await db.query("DELETE FROM companies");
  });
  
afterAll(async function() {
  await db.end();
});

describe("GET /companies", function() {
  test("Gets list of companies", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [{code: 'msf', name: 'Microsoft'}]
    });
  });
});  

describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const response = await request(app).get(`/companies/msf`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: {code: 'msf', name: 'Microsoft',
      description: 'Created windows.'}});
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/twitter`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies", function() {
  test("Adds a new company", async function() {
    const data = {code: "twt", name: "Twitter", description: "Created tweets."}
    const response = await request(app).post('/companies').send(data);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {code: "twt", name: "Twitter", description: "Created tweets."}
    });
  })  
})

describe("PUT /companies/:code", function() {
  test("Updates a single company", async function() {
    const response = await request(app)
      .put(`/companies/msf`)
      .send({
        name: "Microsoft-MSN",
        description: "The Microsoft browser."
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {code: "msf", name: "Microsoft-MSN", description: "The Microsoft browser."}
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
      .delete(`/companies/msf`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ message: "deleted" });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).delete(`/companies/ie`);
    expect(response.statusCode).toEqual(404);
  });
});