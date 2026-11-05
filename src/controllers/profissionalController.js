const pool = require('../config/db');

const FUNCOES = ['tosador', 'veterinario'];

// Confere os dados do profissional. Devolve { erro } ou { dados } ja limpos.
function prepararProfissional(corpo) {
    const nome = (corpo.nome ?? '').trim();
    const { funcao } = corpo;

    if (!nome) {
        return { erro: 'Informe o nome do profissional.' };
    }
    if (!FUNCOES.includes(funcao)) {
        return { erro: 'Informe a função: tosador ou veterinario.' };
    }
    return { dados: [nome, funcao] };
}

async function listarProfissionais(req, res) {
    try {
        const resultado = await pool.query('SELECT * FROM profissionais ORDER BY funcao, nome');
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar profissionais.' });
    }
}

async function criarProfissional(req, res) {
    const { erro, dados } = prepararProfissional(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }

    try {
        const resultado = await pool.query(
            'INSERT INTO profissionais (nome, funcao) VALUES ($1, $2) RETURNING *',
            dados
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar profissional.' });
    }
}

// Profissional nao e excluido (os atendimentos antigos apontam para ele);
// quem sai da equipe e desativado. So da para desativar ou trocar de funcao
// quem nao tem atendimentos agendados daqui para frente.
async function atualizarProfissional(req, res) {
    const { id } = req.params;
    const { erro, dados } = prepararProfissional(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }
    const ativo = req.body.ativo ?? true;

    try {
        const atual = (await pool.query('SELECT * FROM profissionais WHERE id = $1', [id])).rows[0];
        if (!atual) {
            return res.status(404).json({ erro: 'Profissional não encontrado.' });
        }

        const mudaAgenda = !ativo || dados[1] !== atual.funcao;
        if (mudaAgenda) {
            const agendados = (await pool.query(
                `SELECT COUNT(*)::int AS total FROM atendimentos
                 WHERE profissional_id = $1 AND status = 'agendado' AND data_atendimento >= CURRENT_DATE`,
                [id]
            )).rows[0].total;

            if (agendados > 0) {
                return res.status(400).json({
                    erro: `${atual.nome} tem ${agendados} atendimento(s) agendado(s). Remarque ou cancele antes de desativar ou trocar a função.`
                });
            }
        }

        const resultado = await pool.query(
            'UPDATE profissionais SET nome = $1, funcao = $2, ativo = $3 WHERE id = $4 RETURNING *',
            [...dados, ativo, id]
        );
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar profissional.' });
    }
}

module.exports = { listarProfissionais, criarProfissional, atualizarProfissional };
