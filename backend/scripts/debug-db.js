import sql from 'mssql';
import 'dotenv/config';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

console.log('--- DEBUG CONNECTION ---');
console.log(`Server: ${config.server}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);
console.log(`Password Length: ${config.password ? config.password.length : 0}`);
console.log('------------------------');

async function testConnection() {
    try {
        await sql.connect(config);
        console.log('✅ Connected successfully to Azure SQL!');
        const result = await sql.query`SELECT @@version as version, DB_NAME() as dbname`;
        console.log('📅 Version:', result.recordset[0].version);
        console.log('📂 Database:', result.recordset[0].dbname);
        await sql.close();
    } catch (err) {
        console.error('❌ Connection FAILED');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        // console.error('Full Error:', err);
    }
}

testConnection();
