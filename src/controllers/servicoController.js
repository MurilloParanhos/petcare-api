const pool = require('../config/db');

// Confere nome, preco e duracao antes de salvar; devolve a mensagem de erro ou null
function validarServico(nome, preco, duracao_minutos) {
    if (!nome || !nome.trim()) {
        return 'Informe o nome do serviço.';
    }
    if (preco === undefined || preco === null || preco === '' || isNaN(Number(preco)) || Number(preco) < 0) {
        return 'Informe um preço válido (zero ou maior).';
    }
    if (!Number.isInteger(Number(duracao_minutos)) || Number(duracao_minutos) <= 0) {
        return 'Informe a duração em minutos (número inteiro maior que zero).';
    }
    return null;
}

async function listarServicos(req, res) {
    try {
        const resultado = await pool.query('SELECT * FROM servicos ORDER BY nome');
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar serviços.' });
    }
}

async function criarServico(req, res) {
    const { nome, preco } = req.body;
    const duracao_minutos = req.body.duracao_minutos ?? 60;

    const erroValidacao = validarServico(nome, preco, duracao_minutos);
    if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
    }

    try {
        const resultado = await pool.query(
            'INSERT INTO servicos (nome, preco, duracao_minutos) VALUES ($1, $2, $3) RETURNING *',
            [nome.trim(), preco, duracao_minutos]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        // 23505 = violacao de UNIQUE no PostgreSQL
        if (erro.code === '23505') {
            return res.status(400).json({ erro: 'Já existe um serviço com esse nome.' });
        }
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar serviço.' });
    }
}

// Servico nao e excluido (os atendimentos antigos apontam para ele);
// para tirar do catalogo, ele e desativado com ativo = false
async function atualizarServico(req, res) {
    const { id } = req.params;
    const { nome, preco, ativo, duracao_minutos } = req.body;

    const erroValidacao = validarServico(nome, preco, duracao_minutos);
    if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
    }

    try {
        const resultado = await pool.query(
            'UPDATE servicos SET nome = $1, preco = $2, ativo = $3, duracao_minutos = $4 WHERE id = $5 RETURNING *',
            [nome.trim(), preco, ativo ?? true, duracao_minutos, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Serviço não encontrado.' });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        if (erro.code === '23505') {
            return res.status(400).json({ erro: 'Já existe um serviço com esse nome.' });
        }
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar serviço.' });
    }
}

module.exports = { listarServicos, criarServico, atualizarServico };
