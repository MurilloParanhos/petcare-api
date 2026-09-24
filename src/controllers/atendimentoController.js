const pool = require('../config/db');

async function criarAtendimento(req, res) {
    const { cliente_id, tipo_servico, data_atendimento, observacoes } = req.body;

    try {
        const resultado = await pool.query(
            'INSERT INTO atendimentos (cliente_id, tipo_servico, data_atendimento, observacoes) VALUES ($1, $2, $3, $4) RETURNING *',
            [cliente_id, tipo_servico, data_atendimento, observacoes]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar atendimento.' });
    }
}

async function listarAtendimentos(req, res) {
    const { cliente_id } = req.query;

    try {
        let resultado;

        if (cliente_id) {
            resultado = await pool.query(
                'SELECT * FROM atendimentos WHERE cliente_id = $1 ORDER BY data_atendimento DESC',
                [cliente_id]
            );
        } else {
            resultado = await pool.query('SELECT * FROM atendimentos ORDER BY data_atendimento DESC');
        }

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar atendimentos.' });
    }
}

async function atualizarAtendimento(req, res) {
    const { id } = req.params;
    const { cliente_id, tipo_servico, data_atendimento, observacoes } = req.body;

    try {
        const resultado = await pool.query(
            'UPDATE atendimentos SET cliente_id = $1, tipo_servico = $2, data_atendimento = $3, observacoes = $4 WHERE id = $5 RETURNING *',
            [cliente_id, tipo_servico, data_atendimento, observacoes, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Atendimento não encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar atendimento' });
    }
}

async function listarClientesInativos(req, res) {
    try {
        const resultado = await pool.query(`
            SELECT 
                c.id, 
                c.nome, 
                c.telefone,
                MAX(a.data_atendimento) AS ultimo_atendimento
            FROM clientes c
            LEFT JOIN atendimentos a ON a.cliente_id = c.id
            GROUP BY c.id, c.nome, c.telefone
            HAVING MAX(a.data_atendimento) IS NULL 
                OR MAX(a.data_atendimento) < NOW() - INTERVAL '60 days'
            ORDER BY ultimo_atendimento ASC NULLS FIRST
        `);

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar clientes inativos.' });
    }
}

module.exports = { criarAtendimento, listarAtendimentos, atualizarAtendimento, listarClientesInativos };