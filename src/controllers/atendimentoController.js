const pool = require('../config/db');

// Confere os dados do atendimento antes de salvar.
// Devolve { erro } se algo estiver errado, ou { dados } prontos para o banco.
// Em um atendimento novo o servico precisa estar ativo; ao editar um
// atendimento antigo, um servico que foi desativado depois ainda vale.
async function prepararAtendimento(corpo, { novo }) {
    const { cliente_id, servico_id, data_atendimento } = corpo;
    const animal_id = corpo.animal_id || null;
    const observacoes = corpo.observacoes || null;

    if (!cliente_id || !servico_id || !data_atendimento) {
        return { erro: 'Informe cliente, serviço e data.' };
    }

    if (animal_id) {
        const animal = await pool.query(
            'SELECT 1 FROM animais WHERE id = $1 AND cliente_id = $2',
            [animal_id, cliente_id]
        );
        if (animal.rows.length === 0) {
            return { erro: 'Esse animal não pertence ao cliente informado.' };
        }
    }

    const resultado = await pool.query('SELECT * FROM servicos WHERE id = $1', [servico_id]);
    const servico = resultado.rows[0];

    if (!servico || (novo && !servico.ativo)) {
        return { erro: 'Serviço inválido ou desativado.' };
    }

    // Sem valor informado, cobra o preco do catalogo
    const valor = corpo.valor === undefined || corpo.valor === null || corpo.valor === ''
        ? servico.preco
        : Number(corpo.valor);

    if (isNaN(valor) || valor < 0) {
        return { erro: 'Informe um valor válido (zero ou maior).' };
    }

    return {
        dados: [cliente_id, animal_id, servico.id, servico.nome, valor, data_atendimento, observacoes]
    };
}

async function criarAtendimento(req, res) {
    try {
        const { erro, dados } = await prepararAtendimento(req.body, { novo: true });
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            `INSERT INTO atendimentos (cliente_id, animal_id, servico_id, tipo_servico, valor, data_atendimento, observacoes)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            dados
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

    try {
        const { erro, dados } = await prepararAtendimento(req.body, { novo: false });
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            `UPDATE atendimentos
             SET cliente_id = $1, animal_id = $2, servico_id = $3, tipo_servico = $4, valor = $5, data_atendimento = $6, observacoes = $7
             WHERE id = $8 RETURNING *`,
            [...dados, id]
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