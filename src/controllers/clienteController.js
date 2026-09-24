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

async function atualizarCliente(req, res) {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;

    try {
        const resultado = await pool.query(
            'UPDATE clientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4 RETURNING *',
            [nome, telefone, email, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar cliente.' });
    }
}

async function deletarCliente(req, res) {
    const { id } = req.params;

    try {
        const resultado = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }

        res.json({ mensagem: 'Cliente removido com sucesso.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao deletar cliente.' });
    }
}

async function listarClienteComAnimais(req, res) {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `SELECT clientes.nome AS cliente, clientes.telefone, clientes.email,
                    animais.nome AS animal, animais.especie, animais.raca, animais.idade
             FROM clientes
             LEFT JOIN animais ON animais.cliente_id = clientes.id
             WHERE clientes.id = $1`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar cliente com animais.' });
    }
}

module.exports = { criarCliente, listarClientes, atualizarCliente, deletarCliente, listarClienteComAnimais };