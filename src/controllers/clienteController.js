const pool = require('../config/db');

// Confere os dados do cliente antes de salvar.
// Devolve { erro } ou { dados } ja limpos (telefone so com numeros, vazios viram null).
function prepararCliente(corpo) {
    const nome = (corpo.nome ?? '').trim();
    const telefone = (corpo.telefone ?? '').toString().replace(/\D/g, '') || null;
    const email = (corpo.email ?? '').trim() || null;

    if (!nome) {
        return { erro: 'Informe o nome do cliente.' };
    }
    if (telefone && (telefone.length < 10 || telefone.length > 11)) {
        return { erro: 'Telefone inválido: informe o DDD e o número (10 ou 11 dígitos).' };
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { erro: 'Email inválido.' };
    }
    return { dados: [nome, telefone, email] };
}

async function criarCliente(req, res) {
    const { erro, dados } = prepararCliente(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }

    try {
        const resultado = await pool.query(
            'INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING *',
            dados
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
    const { erro, dados } = prepararCliente(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }

    try {
        const resultado = await pool.query(
            'UPDATE clientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4 RETURNING *',
            [...dados, id]
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

// Pets e atendimentos apontam para o cliente, entao o banco nao deixa
// apaga-lo. Antes de tentar, explica o motivo de forma clara.
async function deletarCliente(req, res) {
    const { id } = req.params;

    try {
        const vinculos = (await pool.query(
            `SELECT (SELECT COUNT(*) FROM animais WHERE cliente_id = $1)::int AS pets,
                    (SELECT COUNT(*) FROM atendimentos WHERE cliente_id = $1)::int AS atendimentos`,
            [id]
        )).rows[0];

        if (vinculos.atendimentos > 0) {
            return res.status(400).json({
                erro: `Não é possível excluir: o cliente tem ${vinculos.atendimentos} atendimento(s) no histórico.`
            });
        }
        if (vinculos.pets > 0) {
            return res.status(400).json({
                erro: `Não é possível excluir: o cliente tem ${vinculos.pets} pet(s) cadastrado(s). Exclua os pets antes.`
            });
        }

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
