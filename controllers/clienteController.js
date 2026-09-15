const pool = require('../config/db');

async function criarCliente(req, res) {
    const { nome, telefone, email } = req.body;

    try {
        const resultado = await pool.query(
            'INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING *',
            [nome, telefone, email]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar cliente.' });
    }
}

async function listarClientes(req, res) {
    try {
        const resultado = await pool.query('SELECT * FROM clientes ORDER BY id');
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar clientes.' });
    }
}

module.exports = { criarCliente, listarClientes };