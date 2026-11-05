const pool = require('../config/db');

const FORMATO_DE_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Data de hoje no fuso do servidor, no formato do banco ("2026-11-05")
function hojeISO() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

// Confere os dados da dose. Devolve { erro } ou { dados } ja limpos.
async function prepararVacina(corpo) {
    const nome = (corpo.nome ?? '').trim();
    const { animal_id, data_aplicacao } = corpo;
    const proxima_dose = corpo.proxima_dose || null;
    const observacoes = (corpo.observacoes ?? '').trim() || null;

    if (!animal_id || !nome || !data_aplicacao) {
        return { erro: 'Informe o pet, a vacina e a data de aplicação.' };
    }
    if (!FORMATO_DE_DATA.test(data_aplicacao) || (proxima_dose && !FORMATO_DE_DATA.test(proxima_dose))) {
        return { erro: 'Data inválida. Use o formato AAAA-MM-DD.' };
    }
    if (data_aplicacao > hojeISO()) {
        return { erro: 'A data de aplicação não pode ser no futuro.' };
    }
    if (proxima_dose && proxima_dose <= data_aplicacao) {
        return { erro: 'A próxima dose precisa ser depois da data de aplicação.' };
    }

    const animal = await pool.query('SELECT 1 FROM animais WHERE id = $1', [animal_id]);
    if (animal.rows.length === 0) {
        return { erro: 'Pet não encontrado.' };
    }

    return { dados: [animal_id, nome, data_aplicacao, proxima_dose, observacoes] };
}

async function listarVacinas(req, res) {
    const { animal_id } = req.query;

    try {
        const resultado = animal_id
            ? await pool.query('SELECT * FROM vacinas WHERE animal_id = $1 ORDER BY data_aplicacao DESC', [animal_id])
            : await pool.query('SELECT * FROM vacinas ORDER BY data_aplicacao DESC');
        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar vacinas.' });
    }
}

async function criarVacina(req, res) {
    try {
        const { erro, dados } = await prepararVacina(req.body);
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            `INSERT INTO vacinas (animal_id, nome, data_aplicacao, proxima_dose, observacoes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            dados
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar vacina.' });
    }
}

async function atualizarVacina(req, res) {
    const { id } = req.params;

    try {
        const { erro, dados } = await prepararVacina(req.body);
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            `UPDATE vacinas SET animal_id = $1, nome = $2, data_aplicacao = $3, proxima_dose = $4, observacoes = $5
             WHERE id = $6 RETURNING *`,
            [...dados, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Vacina não encontrada.' });
        }
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar vacina.' });
    }
}

async function excluirVacina(req, res) {
    const { id } = req.params;

    try {
        const resultado = await pool.query('DELETE FROM vacinas WHERE id = $1 RETURNING id', [id]);
        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Vacina não encontrada.' });
        }
        res.json({ mensagem: 'Vacina removida.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover vacina.' });
    }
}

module.exports = { listarVacinas, criarVacina, atualizarVacina, excluirVacina };
