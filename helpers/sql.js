const { BadRequestError } = require("../expressError");

/** sqlForPartialUpdate is a helper function that generates SQL query parts for partial updates.
 * 
 * @param {Object} dataToUpdate - contains the fields to update.
 * Ex: {firstName: 'Elaine', age: 30}
 * 
 * @param {Object} jsToSql - mapping object that converts JavaScript styled keys to SQL style column names. If a key exists in the object being passed in, then the corresponding SQL column name is used. If not, then the original key from 'dataToUpdate' will be used
 * Ex: {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        }
 * 
 * @returns {Object} - Returns an object with two properties:
 *  'setCols' - a string of the SQL columns, which is suitable to be inserted into an UPDATE statement
 * Ex: "first_name"=$1, "age"=$2
 * 
 *  'values' - an array of the values from data to update
 * ex: ['Elaine', 30]
 * 
 * @throws {BadRequestError} - a bad error request is thrown when dataToUpdate is empty. 
  */
 
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
