
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

      // Fix T-SQL and MySQL specifics to SQLite
      let fixedQuery = q
        .replace(/GETDATE\(\)/gi, "datetime('now', 'localtime')")
        .replace(/CURRENT_TIMESTAMP/gi, "datetime('now', 'localtime')")
        .replace(/scope_identity\(\)/gi, "last_insert_rowid()")
        .replace(/CURDATE\(\)/gi, "date('now', 'localtime')")
        .replace(/NOW\(\)/gi, "datetime('now', 'localtime')")
        // Handle DATE_SUB(NOW(), INTERVAL @days DAY) -> datetime('now', '-' || @days || ' days')
        .replace(/DATE_SUB\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+@(\w+)\s+DAY\s*\)/gi, "datetime('now', '-' || @$1 || ' days')");

      // Handle common T-SQL top usage
      if (/SELECT\s+TOP\s+\d+\s+/i.test(fixedQuery)) {
        const match = fixedQuery.match(/SELECT\s+TOP\s+(\d+)\s+/i);
        if (match) {
          fixedQuery = fixedQuery.replace(/SELECT\s+TOP\s+\d+\s+/i, "SELECT ");
          // Append LIMIT at the end if not present (simple heuristic)
          if (!fixedQuery.toLowerCase().includes('limit ')) {
            fixedQuery += ` LIMIT ${match[1]}`;
          }
        }
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
