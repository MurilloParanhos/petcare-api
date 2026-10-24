// Roda uma vez antes de todos os testes: apaga e recria o schema de testes
// com as tabelas do database/schema.sql (que fica testado de quebra).
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ quiet: true });

const SCHEMA = 'testes_petcare';

module.exports = async () => {
    const cliente = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    });

    await cliente.connect();
    try {
        await cliente.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
        await cliente.query(`CREATE SCHEMA ${SCHEMA}`);
        await cliente.query(`SET search_path TO ${SCHEMA}`);
        await cliente.query(fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8'));
    } finally {
        await cliente.end();
    }
};
