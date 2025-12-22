import db, { init } from './database.js';

// Wait for database initialization
await init;

// Convert SQL Server syntax to SQLite
function convertQuery(sqlQuery) {
  let query = sqlQuery;
  
  // Replace GETDATE() with datetime('now')
  query = query.replace(/GETDATE\(\)/gi, "datetime('now')");
  
  // Replace SCOPE_IDENTITY() with last_insert_rowid()
  query = query.replace(/SCOPE_IDENTITY\(\)/gi, 'last_insert_rowid()');
  
  // Replace DATEADD(hour, -24, GETDATE()) with datetime('now', '-24 hours')
  query = query.replace(/DATEADD\s*\(\s*hour\s*,\s*(-?\d+)\s*,\s*GETDATE\(\)\s*\)/gi, 
    (match, hours) => `datetime('now', '${hours} hours')`);
  
  // Replace FORMAT(date, 'HH:00') with strftime('%H:00', date)
  query = query.replace(/FORMAT\s*\(\s*(\w+(?:\.\w+)?)\s*,\s*'HH:00'\s*\)/gi, 
    (match, col) => `strftime('%H:00', ${col})`);
  
  // Replace COALESCE - SQLite supports this natively, no change needed
  
  return query;
}

// Create a wrapper that mimics mssql poolPromise API
const createRequest = () => {
  const params = {};
  
  return {
    input(name, value) {
      params[name] = value;
      return this;
    },
    async query(sqlQuery) {
      // Convert SQL Server syntax to SQLite
      let processedQuery = convertQuery(sqlQuery);
      
      // Replace @paramName with ? and collect values in order
      const paramOrder = [];
      processedQuery = processedQuery.replace(/@(\w+)/g, (match, name) => {
        paramOrder.push(name);
        return '?';
      });
      
      const paramValues = paramOrder.map(name => params[name]);
      
      // Handle different query types
      const trimmedQuery = processedQuery.trim().toUpperCase();
      
      try {
        if (trimmedQuery.startsWith('SELECT')) {
          const results = db.prepare(processedQuery).all(...paramValues);
          return { recordset: results };
        } else if (trimmedQuery.includes('INSERT')) {
          // Handle INSERT with SELECT (for getting last ID)
          if (processedQuery.includes('last_insert_rowid()')) {
            // Split into INSERT and SELECT
            const parts = processedQuery.split(';').map(p => p.trim()).filter(p => p);
            let lastId = null;
            
            for (const part of parts) {
              if (part.toUpperCase().startsWith('INSERT')) {
                const result = db.prepare(part).run(...paramValues);
                lastId = result.lastInsertRowid;
              } else if (part.toUpperCase().startsWith('SELECT') && part.includes('last_insert_rowid()')) {
                return { recordset: [{ id: lastId }] };
              }
            }
            return { recordset: [{ id: lastId }] };
          }
          
          const result = db.prepare(processedQuery).run(...paramValues);
          return { recordset: [], rowsAffected: [result.changes], lastInsertRowid: result.lastInsertRowid };
        } else if (trimmedQuery.startsWith('UPDATE') || trimmedQuery.startsWith('DELETE')) {
          const result = db.prepare(processedQuery).run(...paramValues);
          return { recordset: [], rowsAffected: [result.changes] };
        } else {
          db.exec(processedQuery);
          return { recordset: [] };
        }
      } catch (error) {
        console.error('SQL Error:', error.message);
        console.error('Query:', processedQuery);
        console.error('Params:', paramValues);
        throw error;
      }
    }
  };
};

const poolPromise = Promise.resolve({
  request: createRequest
});

// Dummy sql object for compatibility
const sql = {
  Int: 'Int',
  NVarChar: 'NVarChar',
  DateTime: 'DateTime',
  Bit: 'Bit'
};

export { sql, poolPromise };
