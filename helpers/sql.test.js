const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
  test("works: multiple fields with mapping", () => {
    const data = {
      firstName: "Elaine",
      lastName: "Quach",
      email: "equach@gmail.com",
    };
    const jsToSql = { firstName: "first_name", lastName: "last_name" };
    const result = sqlForPartialUpdate(data, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2, "email"=$3',
      values: ["Elaine", "Quach", "equach@gmail.com"],
    });
  });
  test("works: single fields with mapping", () => {
    const data = {
      firstName: "Elaine",
    };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(data, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Elaine"],
    });
  });
  test("works: single fields with mapping", () => {
    const data = {
      firstName: "Elaine",
    };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(data, jsToSql);
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Elaine"],
    });
  });
  test("bad request error: no data to update is provided", () => {
    const jsToSql = { firstName: "first_name" };
    expect(() => {
      sqlForPartialUpdate({}, jsToSql);
    }).toThrow(BadRequestError);
  });

  test("type error: dataToUpdate is null", () => {
    const jsToSql = { firstName: "first_name" };
    expect(() => {
      sqlForPartialUpdate(null, jsToSql);
    }).toThrow(TypeError);
  });

  test("works: no matching key in jsToSql will use the original key from dataToUpdate", () => {
    const data = { firstName: "Elaine", faveColor: "Green" };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(data, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "faveColor"=$2',
      values: ["Elaine", "Green"],
    });
  });
});
