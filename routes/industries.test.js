process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

beforeAll(async function() {
  await db.query("DELETE FROM companies;");
  await db.query("DELETE FROM industries;");
  await db.query("DELETE FROM companies_industries;");
})

beforeEach(async function() { 
  await db.query(`INSERT INTO companies
                  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
                         ('ibm', 'IBM', 'Big blue.')`);
  
  await db.query(`INSERT INTO industries
                  VALUES ('tech', 'Technology'),
                         ('ent', 'Entertainment'),
                         ('bus', 'Business Services')`);
  
  await db.query(`INSERT INTO companies_industries
                  VALUES ('ibm', 'tech'),
                         ('apple', 'ent'),
                         ('apple', 'tech')`);
});

afterEach(async function() {
    await db.query("DELETE FROM companies;");
    await db.query("DELETE FROM industries;");
    await db.query("DELETE FROM companies_industries;");
  });
  
afterAll(async function() {
  await db.end();
});

describe("GET /industries", function() {
  test("Gets list of invoices", async function() {
    const response = await request(app).get(`/industries`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
        "industries": [
          {
            "i_code": "tech",
            "industry": "Technology",
            "companies": [
              "ibm",
              "apple"
            ]
          },
          {
            "i_code": "ent",
            "industry": "Entertainment",
            "companies": [
              "apple"
            ]
          }
        ]
    });
  });
});  

describe("POST /industries", function() {
  test("Adds a new industry", async function() {
    const data = {i_code: 'ag', industry: 'agriculture'};
    const response = await request(app).post('/industries').send(data);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      industry: {i_code: 'ag', industry: 'agriculture'}
    });
  })  
})

describe("POST /industries/:i_code", function() {
  test("Associates company to industry", async function() {
    const response = await request(app)
      .post(`/industries/bus`)
      .send({comp_code: 'ibm'});
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      association: {indust_code: 'bus', comp_code: 'ibm'} 
    })
  });
});  

//   test("Responds with 404 if can't find invoice", async function() {
//     const response = await request(app).put(`/invoices/10000000`).send({amt: 100});
//     expect(response.statusCode).toEqual(404);
//   });
// });

// describe("DELETE /invoices/:id", function() {
//   test("Deletes a single invoice", async function() {
//     const response = await request(app)
//       .delete(`/invoices/${testInvoice.id}`);
//     expect(response.statusCode).toEqual(200);
//     expect(response.body).toEqual({ message: "deleted" });
//   });

//   test("Responds with 404 if can't find invoice", async function() {
//     const response = await request(app).delete(`/invoice/10000000`);
//     expect(response.statusCode).toEqual(404);
//   });
// });