const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

// returns list of invoices
router.get("/", async function (req, res, next) {
  try {
    const invoiceQuery = await db.query(
      `SELECT id, comp_code FROM invoices`);
    return res.json({invoices: invoiceQuery.rows});
  }
  catch (err) {
    return next(err);
  }
});

// returns single invoice
router.get("/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const invoiceQuery = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, code, name, description 
       FROM invoices JOIN companies ON companies.code = invoices.comp_code
       WHERE id=$1`, [id]
    );
    if (invoiceQuery.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id '${id}`, 404);
    }
    const invoiceResult = invoiceQuery.rows[0];
    const company = {code: invoiceResult.code, name: invoiceResult.name, description: invoiceResult.description};
    return res.json({invoice: {
                       id: id,
                       amt: invoiceResult.amt,
                       paid: invoiceResult.paid,
                       add_date: `${invoiceResult.add_date}`,
                       paid_date: invoiceResult.paid_date,
                       company: company
                    }})
  }                  
  catch (err) {
    return next(err);
  }
})

//   Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}

// creates and returns new invoice
router.post("/", async function (req, res, next) {
  try {
    const { amt, comp_code } = req.body;
    const result = await db.query(
          `INSERT INTO invoices (amt, comp_code)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
           [amt, comp_code]
    );
    return res.status(201).json({invoice: result.rows[0]});
  }
  catch (err) {
    return next(err);
  }
})

// updates and returns invoice
router.put("/:id", async function (req, res, next) {
  try {
    if ("id" in req.body) {
      throw new ExpressError("Not allowed", 400)
    }

    const result = await db.query(
      `UPDATE invoices
           SET amt = $1
           WHERE id = ${req.params.id}
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.amt]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`There is no  with invoice with id of ${req.params.id}`, 404);
    }
    return res.json({ invoice: result.rows[0]});
  } catch (err) {
    return next(err);
  }  
})

// removes invoice from database
router.delete("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
        `DELETE FROM invoices WHERE id = $1
         RETURNING id`,
        [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of '${req.params.id}`, 404);    
    }  
    return res.json({message: "deleted"});
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;