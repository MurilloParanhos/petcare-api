// Monta o app Express (rotas e arquivos estaticos) sem abrir a porta.
// Fica separado do server.js para os testes usarem o app direto.
const path = require('path');
const express = require('express');
const pool = require('./config/db');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const animalRoutes = require('./routes/animalRoutes');
const atendimentoRoutes = require('./routes/atendimentoRoutes');
const servicoRoutes = require('./routes/servicoRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', usuarioRoutes);
app.use('/api', clienteRoutes);
app.use('/api', animalRoutes);
app.use('/api', atendimentoRoutes);
app.use('/api', servicoRoutes);
app.use('/api', profissionalRoutes);

app.get('/api/status', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT NOW()');
        res.send(`Conectado ao banco! Hora do banco: ${resultado.rows[0].now}`);
    } catch (erro) {
        console.error(erro);
        res.status(500).send('Erro ao conectar no banco.');
    }
});

module.exports = app;
