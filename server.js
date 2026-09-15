const express = require('express');
const pool = require('./config/db');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

const app = express();
app.use(express.json());
app.use('/api', usuarioRoutes);
app.use('/api', clienteRoutes);

const PORT = 3000;

app.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT NOW()');
        res.send(`Conectado ao banco! Hora do banco: ${resultado.rows[0].now}`);
    } catch (erro) {
        console.error(erro);
        res.status(500).send('Erro ao conectar no banco.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});