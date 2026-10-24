const pool = require('../config/db');

async function listarProfissionais(req, res) {
    try {
        const resultado = await pool.query('SELECT * FROM profissionais ORDER BY funcao, nome');
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar profissionais.' });
    }
}

module.exports = { listarProfissionais };
