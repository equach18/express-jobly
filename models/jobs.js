"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs fitting the search parameters. If no filters are provided, then return all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   *
   * Throws NotFoundError if not found.
   * */
  static async findAll({ minSalary, hasEquity, title } = {}) {
    // initialize the query string
    let query = `SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS "companyHandle", c.company_name AS "companyName" 
                FROM jobs j
                LEFT JOIN companies AS c ON c.handle = j.company_handle  `;
    let whereExpression = [];
    let vals = [];

    // add filtering conditions if provided in the parameters
    if (minSalary !== undefined) {
      vals.push(minSalary);
      whereExpression.push(`j.salary >= $${vals.length}`);
    }
    if (hasEquity === true) {
      vals.push(hasEquity);
      whereExpression.push(`j.equity > 0`);
    }
    if (title !== undefined) {
      vals.push(`%${title}%`);
      whereExpression.push(`title ILIKE $${vals.length}`);
    }

    // if filtering parameters were given add WHERE clause and expressions, joined by AND
    if (whereExpression.length > 0) {
      query += " WHERE " + whereExpression.join(" AND ");
    }
    // finish the query by ordering by name and execute it
    query += " ORDER BY title";
    const jobs = await db.query(query, vals);
    if (jobs.rows.length === 0) throw new NotFoundError(`No jobs found.`);

    return jobs.rows;
  }

  /** Given a job id, return data about that job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id=$1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companyRes = await db.query(
      `SELECT handle,
        name,
        description,
        num_employees AS "numEmployees",
        logo_url AS "logoUrl"
        FROM companies
        WHERE handle = $1`,
      [job.companyHandle]
    );
    delete job.companyHandle;
    job.company = companyRes.rows[0];

    return job;
  }

  /** Update job data with data.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job id not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
