"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const { createToken } = require("../helpers/tokens");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  jobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// make u2 an admin
const u2Token = createToken({ username: "u2", isAdmin: true });
/************************************** POST /jobs */
describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 3000,
    equity: 0.02,
    companyHandle: "c2",
  };

  test("works for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 3000,
        equity: "0.02",
        companyHandle: "c2",
      },
    });
  });
  test("Authorization error when not admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing title", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 3000,
        equity: 0.02,
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request with missing company handle", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "testjob",
        salary: 3000,
        equity: 0.02,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: 3435,
        salary: "not an int",
        equity: 0.02,
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */
describe("GET /companies", function () {
  test("ok for anon and works without filters", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[0],
          title: "j1",
          salary: 1000,
          equity: "0",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: jobIds[1],
          title: "j2",
          salary: 2000,
          equity: "0.01",
          companyHandle: "c2",
          companyName: "C2",
        },
        {
          id: jobIds[2],
          title: "j3",
          salary: 3000,
          equity: "0.02",
          companyHandle: "c2",
          companyName: "C2",
        },
      ],
    });
  });

  /** Filtering tests */
  test("works: filter by title", async () => {
    const resp = await request(app).get("/jobs").query({ title: "j" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[0],
          title: "j1",
          salary: 1000,
          equity: "0",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: jobIds[1],
          title: "j2",
          salary: 2000,
          equity: "0.01",
          companyHandle: "c2",
          companyName: "C2",
        },
        {
          id: jobIds[2],
          title: "j3",
          salary: 3000,
          equity: "0.02",
          companyHandle: "c2",
          companyName: "C2",
        },
      ],
    });
  });
  test("works: filter by minSalary", async () => {
    const resp = await request(app).get("/jobs").query({ minSalary: 2000 });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[1],
          title: "j2",
          salary: 2000,
          equity: "0.01",
          companyHandle: "c2",
          companyName: "C2",
        },
        {
          id: jobIds[2],
          title: "j3",
          salary: 3000,
          equity: "0.02",
          companyHandle: "c2",
          companyName: "C2",
        },
      ],
    });
  });
  test("works: filter by hasEquity", async () => {
    const resp = await request(app).get("/jobs").query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[1],
          title: "j2",
          salary: 2000,
          equity: "0.01",
          companyHandle: "c2",
          companyName: "C2",
        },
        {
          id: jobIds[2],
          title: "j3",
          salary: 3000,
          equity: "0.02",
          companyHandle: "c2",
          companyName: "C2",
        },
      ],
    });
  });
  test("400 on invalid filter fields", async () => {
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: "thisisastring", anotherFilter: "stringgg" });
    expect(resp.statusCode).toEqual(400);
  });

  test("works: filter with multiple parameters", async () => {
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: 3000, hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobIds[2],
          title: "j3",
          salary: 3000,
          equity: "0.02",
          companyHandle: "c2",
          companyName: "C2",
        },
      ],
    });
  });

  test("not found when there is no match", async function () {
    const resp = await request(app).get("/jobs").query({ title: "notReal" });
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "j1",
        salary: 1000,
        equity: "0",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("not found for invalid job id", async function () {
    const resp = await request(app).get(`/jobs/384756`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "J1-new",
        salary: 1200,
        equity: 0.02,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J1-new",
        salary: 1200,
        equity: "0.02",
        companyHandle: "c1",
      },
    });
  });
    test("Auth error for non admin", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401)
    });

    test("unauth for anon", async function () {
      const resp = await request(app).patch(`/jobs/${jobIds[0]}`).send({
        title: "j1-new",
      });
      expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job id", async function () {
      const resp = await request(app)
        .patch(`/jobs/38459`)
        .send({
          title: "J1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          id: 3458,
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          salary: "not-a-salary",
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: jobIds[0] });
  });

  test("auth error for non admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${jobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job id", async function () {
    const u2Token = createToken({ username: "u2", isAdmin: true });
    const resp = await request(app)
      .delete(`/jobs/38476`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
