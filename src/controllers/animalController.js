const pool = require('../config/db');

// Confere os dados do animal antes de salvar.
// Devolve { erro } ou { dados } ja limpos (raca e idade vazias viram null).
async function prepararAnimal(corpo) {
    const nome = (corpo.nome ?? '').trim();
    const especie = (corpo.especie ?? '').trim();
    const raca = (corpo.raca ?? '').trim() || null;
    const idade = corpo.idade === undefined || corpo.idade === null || corpo.idade === '' ? null : Number(corpo.idade);
    const { cliente_id } = corpo;

    if (!nome || !especie) {
        return { erro: 'Informe pelo menos o nome e a espécie do animal.' };
    }
    if (idade !== null && (!Number.isInteger(idade) || idade < 0 || idade > 40)) {
        return { erro: 'Idade inválida: informe um número inteiro de 0 a 40.' };
    }
    if (!cliente_id) {
        return { erro: 'Informe o dono do animal.' };
    }

    const dono = await pool.query('SELECT 1 FROM clientes WHERE id = $1', [cliente_id]);
    if (dono.rows.length === 0) {
        return { erro: 'Dono não encontrado.' };
    }

    return { dados: [nome, especie, raca, idade, cliente_id] };
}

async function criarAnimal(req, res) {
    try {
        const { erro, dados } = await prepararAnimal(req.body);
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            'INSERT INTO animais (nome, especie, raca, idade, cliente_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            dados
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar o animal.' });
    }
}

async function listarAnimais(req, res) {
    const { cliente_id } = req.query;

    try {
        let resultado;

        if (cliente_id) {
            resultado = await pool.query('SELECT * FROM animais WHERE cliente_id = $1 ORDER BY id', [cliente_id]);
        } else {
            resultado = await pool.query('SELECT * FROM animais ORDER BY id');
        }

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar animais.' });
    }
}

async function atualizarAnimais(req, res) {
    const { id } = req.params;

    try {
        const { erro, dados } = await prepararAnimal(req.body);
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            'UPDATE animais SET nome = $1, especie = $2, raca = $3, idade = $4, cliente_id = $5 WHERE id = $6 RETURNING *',
            [...dados, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Animal não encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar animal' });
    }
}

// Os atendimentos do animal continuam no historico, so perdem o vinculo
// com ele (animal_id e ON DELETE SET NULL)
async function deletarAnimais(req, res) {
    const { id } = req.params;

    try {
        const resultado = await pool.query('DELETE FROM animais WHERE id = $1 RETURNING *', [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Animal não encontrado' });
        }

        res.json({ mensagem: 'Animal removido com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao deletar o animal' });
    }
}

module.exports = { criarAnimal, listarAnimais, atualizarAnimais, deletarAnimais };
