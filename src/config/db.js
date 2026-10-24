const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

// Os testes rodam num schema separado (DB_SCHEMA), para nao tocar nos dados reais.
// O nome so aceita letras, numeros e _ porque vai direto na configuracao da conexao.
const schema = process.env.DB_SCHEMA;
if (schema && !/^\w+$/.test(schema)) {
    throw new Error(`DB_SCHEMA inválido: ${schema}`);
}

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    // Ja abre cada conexao usando o schema de testes, quando houver
    options: schema ? `-c search_path=${schema}` : undefined
});

module.exports = pool;
