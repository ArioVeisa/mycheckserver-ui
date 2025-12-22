import db, { init } from './database.js';

// Database initialization promise
let dbReady = init;

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
  
  // Convert SELECT TOP N ... to SELECT ... LIMIT N (SQL Server to SQLite)
  // Handle both numeric TOP (TOP 20) and parameterized TOP (TOP (@limit))
  let topValue = null;
  
  // Check for numeric TOP
  const numericTopMatch = sqlQuery.match(/SELECT\s+TOP\s+(\d+)\s+/i);
  if (numericTopMatch) {
    topValue = numericTopMatch[1];
    query = query.replace(/SELECT\s+TOP\s+\d+\s+/gi, 'SELECT ');
  }
  
  // Check for parameterized TOP like TOP (@limit)
  const paramTopMatch = sqlQuery.match(/SELECT\s+TOP\s+\(\s*@(\w+)\s*\)\s+/i);
  if (paramTopMatch) {
    topValue = `@${paramTopMatch[1]}`;
    query = query.replace(/SELECT\s+TOP\s+\(\s*@\w+\s*\)\s+/gi, 'SELECT ');
  }
  
  // Add LIMIT at the end if TOP was used
  if (topValue) {
    // Remove any existing LIMIT clause first
    query = query.replace(/\s+LIMIT\s+(?:\d+|@\w+|\?)\s*$/i, '');
    query = query.trimEnd() + ` LIMIT ${topValue}`;
  }
  
  // Replace COALESCE - SQLite supports this natively, no change needed
  
  // Convert SQL Server bracket notation [column] to just column (SQLite doesn't need escaping for 'read')
  query = query.replace(/\[(\w+)\]/g, '$1');
  
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
      // Wait for database to be ready
      await dbReady;
      
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
                // Count how many ? are in this part to know how many params to use
                const paramCount = (part.match(/\?/g) || []).length;
                const insertParams = paramValues.slice(0, paramCount);
                console.log('Running INSERT:', part);
                console.log('With params:', insertParams);
                const result = db.prepare(part).run(...insertParams);
                console.log('INSERT result:', result);
                lastId = result.lastInsertRowid;
                console.log('lastId:', lastId);
              } else if (part.toUpperCase().startsWith('SELECT') && part.includes('last_insert_rowid()')) {
                console.log('Returning lastId:', lastId);
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
