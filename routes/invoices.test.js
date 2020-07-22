process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

beforeAll(async function() {
  await db.query("DELETE FROM invoices;");
  await db.query("DELETE FROM companies;");
})

beforeEach(async function() { 
  let compResult = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('apple', 'Apple', 'Created iphone.')
      RETURNING code, name, description`);
  testCompany = compResult.rows[0];  

  let invResult = await db.query(`
    INSERT INTO
      invoices (amt, comp_code) VALUES (50.00, 'apple')
      RETURNING id, amt, paid, add_date, paid_date, comp_code`);
  testInvoice = invResult.rows[0];
});

afterEach(async function() {
    await db.query("DELETE FROM invoices;");
    await db.query("DELETE FROM companies;");
  });
  
afterAll(async function() {
  await db.end();
});

describe("GET /invoices", function() {
  test("Gets list of invoices", async function() {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoices: [{id: testInvoice.id, comp_code: 'apple'}]
    });
  });
});  

describe("GET /invoices/:code", function() {
  test("Gets a single invoice", async function() {
    console.log(testInvoice.add_date.toString());
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
        invoice: {id: `${testInvoice.id}`, 
                  amt: 50.00,
                  paid: false,
                  add_date: `${testInvoice.add_date}`,
                  paid_date: null,
                  company: {code: 'apple', name: 'Apple', description: 'Created iphone.'}
        }
    });    
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).get(`/invoices/100000000`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /invoices", function() {
  test("Adds a new invoice", async function() {
    const data = {amt: 75.00, comp_code: 'apple'};
    const response = await request(app).post('/invoices').send(data);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {id: expect.any(Number), 
                comp_code: "apple", 
                amt: 75.00, paid: false,
                paid: false, 
                add_date: expect.any(String), 
                paid_date: null
      }
    });
  })  
})

describe("PUT /invoices/:id", function() {
  test("Updates a single invoice", async function() {
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({amt: 55.00});
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {id: testInvoice.id, 
                comp_code: "apple", 
                amt: 55.00, paid: false,
                paid: false, 
                add_date: expect.any(String), 
                paid_date: null
      }          
    })
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).put(`/invoices/10000000`).send({amt: 100});
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /invoices/:id", function() {
  test("Deletes a single invoice", async function() {
    const response = await request(app)
      .delete(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ message: "deleted" });
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).delete(`/invoice/10000000`);
    expect(response.statusCode).toEqual(404);
  });
});