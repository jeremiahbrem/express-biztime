const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

// returns list of companies
router.get("/", async function (req, res, next) {
  try {
    const companyQuery = await db.query(
      `SELECT code, name FROM companies`);
    return res.json({companies: companyQuery.rows});
  }
  catch (err) {
    return next(err);
  }
});

// returns single company
router.get("/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    const companyQuery = await db.query(
      `SELECT code, name, description FROM companies WHERE code=$1`, [code]
    );
    if (companyQuery.rows.length === 0) {
      throw new ExpressError(`There is no company with code '${code}`, 404);
    }
    return res.json({company: companyQuery.rows[0]});
  }
  catch (err) {
    return next(err);
  }
})

// creates and returns new company
router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
          `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
           [code, name, description]
    );
    return res.status(201).json({company: result.rows[0]});
  }
  catch (err) {
    return next(err);
  }
})

// updates and returns company
router.put("/:code", async function (req, res, next) {
  try {
    if ("code" in req.body) {
      throw new ExpressError("Not allowed", 400)
    }

    const result = await db.query(
      `UPDATE companies 
           SET name = $1, description = $2
           WHERE code = $3
           RETURNING code, name, description`,
      [req.body.name, req.body.description, req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of ${req.params.code}`, 404);
    }
    return res.json({ company: result.rows[0]});
  } catch (err) {
    return next(err);
  }  
})

// removes company from database
router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
        `DELETE FROM companies WHERE code = $1
         RETURNING code`,
        [req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);    
    }  
    return res.json({message: "deleted"});
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;