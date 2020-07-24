const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

// returns list of industries
router.get("/", async function (req, res, next) {
  try {
    const indQuery = await db.query(
      `SELECT i.i_code, i.industry, c.code
      FROM industries AS i
      JOIN companies_industries AS ci
      ON ci.indust_code = i.i_code 
      JOIN companies as c
      ON ci.comp_code = c.code`);
        
      /* need to convert query result from [{i_code, industry, company}, {i_code, industry, company}, ...]
      to [{i_code, industry, [companies]}, {i_code, industry, [companies]}, ...] */
        
      // creates object with individual industry codes as keys, with industry and array of companies as values
      const industryObj = {};
      indQuery.rows.forEach(ind => {
      if (industryObj[ind['i_code']]) {
          industryObj[ind['i_code']][1].push(ind['code']);
      }
      else {
          industryObj[ind['i_code']] = [ind['industry'],[ind['code']]];
      }
      })

      // returns array of industry objects for JSON response ( {i_code, industry, [companies]} )
      const industries = [];
      for (let [k,v] of Object.entries(industryObj)) {
      industries.push({"i_code": k, "industry": v[0], "companies": v[1]})
      }

  return res.json({industries});
  }
  catch (err) {
    return next(err);
  }
});

// adds new industry
router.post("/", async function (req, res, next) {
  try {
    const { i_code, industry } = req.body;
    const result = await db.query(
          `INSERT INTO industries(i_code, industry)
           VALUES ($1, $2)
           RETURNING i_code, industry`,
           [i_code, industry]
    );
    return res.status(201).json({industry: result.rows[0]});
  }
  catch (err) {
    return next(err);
  }
})

// associates industry to company
router.post("/:i_code", async function (req, res, next) {
  try {
    const { comp_code } = req.body;
    const result = await db.query(
          `INSERT INTO companies_industries (comp_code, indust_code)
           VALUES ($1, $2)
           RETURNING indust_code, comp_code`,
           [comp_code, req.params.i_code]   
    );
    return res.status(201).json({association: result.rows[0]})
  }
  catch (err) {
    return next(err);
  }
})

module.exports = router;