"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  test("works", async function () {
    const newJob = {
      title: "new",
      salary: 34534,
      equity: "0",
      companyHandle: "c1",
    };
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 34534,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle 
           FROM jobs
           WHERE title = 'new'`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 34534,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });
  test("works with null salary and equity", async function () {
    const newJob = {
      title: "new",
      salary: null,
      equity: null,
      companyHandle: "c1",
    };
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: null,
      equity: null,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.1",
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: returns multiple jobs from partial title match", async function () {
    let jobs = await Job.findAll({ title: "j" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.1",
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: returns single matching company using title filter", async function () {
    let jobs = await Job.findAll({ title: "j3" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: filtering by minSalary", async function () {
    let jobs = await Job.findAll({ minSalary: 200000 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.1",
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: filtering by hasEquity", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.1",
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  test("works: with muliple filters", async function () {
    let jobs = await Job.findAll({
      hasEquity: true,
      minSalary: 200000,
      title: "j",
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.1",
        companyHandle: "c2",
        companyName: "C2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.2",
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });

  test("not found error when there are no matches", async () => {
    try {
      await Job.findAll({ title: "someJob" });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(jobIds[0]);
    expect(job).toEqual({
      id: jobIds[0],
      title: "j1",
      salary: 100000,
      equity: "0",
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(48584568);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 3785634,
    equity: 0.01,
  };
  test("works", async function () {
    let job = await Job.update(jobIds[0], updateData);
    expect(job).toEqual({
      companyHandle: "c1",
      id: jobIds[0],
      title: "New",
      salary: 3785634,
      equity: "0.01",
    });

    const result = await db.query(
      `SELECT title, salary, equity, id, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [jobIds[0]]
    );
    expect(result.rows).toEqual([
      {
        id: jobIds[0],
        title: "New",
        salary: 3785634,
        equity: "0.01",
        companyHandle: "c1",
      },
    ]);
  });
  test("works with null fields", async function () {
    const updateDataWithNulls = {
      title: "New2",
      salary: null,
      equity: null,
    };

    let job = await Job.update(jobIds[0], updateDataWithNulls);

    expect(job).toEqual({
      title: "New2",
      salary: null,
      equity: null,
      id: jobIds[0],
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT title, salary, equity, id, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [jobIds[0]]
    );
    expect(result.rows).toEqual([
      {
        id: jobIds[0],
        title: "New2",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job id", async function () {
    try {
      await Job.update(34543, updateData);
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobIds[0], {});
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds[0]);
    const res = await db.query("SELECT handle FROM companies WHERE handle=$1", [
      jobIds[0],
    ]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job id", async function () {
    try {
      await Job.remove(234656);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
