
import database, { init } from './database.js';

// Initialize the database immediately
init.catch(err => console.error('Failed to initialize SQLite:', err));

const createRequest = () => {
  const params = {};
  return {
    input(name, typeOrVal, val) {
      // Handle optional type argument: input(name, value) or input(name, type, value)
      if (val === undefined) {
        params['@' + name] = typeOrVal;
      } else {
        params['@' + name] = val;
      }
      return this;
    },
    async query(q) {
      await init;

      // Fix T-SQL specifics to SQLite
      let fixedQuery = q
        .replace(/GETDATE\(\)/gi, "CURRENT_TIMESTAMP")
        .replace(/SCOPE_IDENTITY\(\)/gi, "last_insert_rowid()");

      // Handle common T-SQL top usage: SELECT TOP 1 * FROM ... -> SELECT * FROM ... LIMIT 1
      if (/SELECT\s+TOP\s+1\s+/i.test(fixedQuery)) {
        fixedQuery = fixedQuery.replace(/SELECT\s+TOP\s+1\s+/i, "SELECT ");
        fixedQuery += " LIMIT 1";
      }

      console.log('SQL Proxy Query:', fixedQuery, 'Params:', params);

      try {
        if (/^\s*(select|pragma)/i.test(fixedQuery)) {
          const rows = database.prepare(fixedQuery).all(params);
          return { recordset: rows, recordsets: [rows], rowsAffected: [rows.length] };
        } else {
          try {
            const res = database.prepare(fixedQuery).run(params);
            // res = { changes: number, lastInsertRowid: number }
            return {
              recordset: [],
              rowsAffected: [res.changes],
              // Mock output parameters if needed? No, standard result usually enough
            };
          } catch (runErr) {
            // Handle "UNIQUE constraint failed" or similar
            console.error('SQL Proxy Run Error:', runErr);
            throw runErr;
          }
        }
      } catch (err) {
        console.error("SQL Proxy Error:", err, "Query:", fixedQuery);
        throw err;
      }
    }
  };
};

const poolPromise = Promise.resolve({
  request: createRequest,
  connect: () => Promise.resolve({ request: createRequest }),
  close: () => Promise.resolve()
});

export { poolPromise };

// Mock SQL Types object to prevent crashes if controllers import sql.Int etc.
export const sql = {
  Int: 'Int',
  NVarChar: 'NVarChar',
  VarChar: 'VarChar',
  Bit: 'Bit',
  DateTime: 'DateTime',
  Text: 'Text'
};

export default {
  sql,
  poolPromise
};
