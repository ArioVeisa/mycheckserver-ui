import sql from 'mssql';
import 'dotenv/config';

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    }
};

async function testConnection() {
    try {
        console.log('Connecting to database...');
        console.log(`Server: ${config.server}`);
        console.log(`User: ${config.user}`);
        console.log(`Database: ${config.database}`);

        await sql.connect(config);
        console.log('Connected successfully!');

        const result = await sql.query`SELECT @@version as version`;
        console.log('Database version:', result.recordset[0].version);

        await sql.close();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

testConnection();
