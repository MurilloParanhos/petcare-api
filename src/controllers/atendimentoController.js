const pool = require('../config/db');

// Horario de funcionamento, em minutos desde a meia-noite (09:00 e 17:00)
const ABERTURA = 9 * 60;
const FECHAMENTO = 17 * 60;

const STATUS = ['agendado', 'concluido', 'cancelado', 'faltou'];

function emMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

// Data de hoje no fuso do servidor, no formato do banco ("2026-11-02")
function hojeISO() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

// Procura outro atendimento na agenda do profissional que se sobreponha a
// esse horario. Atendimento cancelado nao ocupa a agenda. Dois intervalos
// se sobrepoem quando um comeca antes do outro terminar.
// Devolve o atendimento em conflito ou null.
async function conflitoNaAgenda({ data, profissionalId, ignorarId, hora, duracao }) {
    const resultado = await pool.query(
        `SELECT to_char(a.hora_atendimento, 'HH24:MI') AS hora, a.tipo_servico, p.nome AS profissional
         FROM atendimentos a
         JOIN servicos s ON s.id = a.servico_id
         JOIN profissionais p ON p.id = a.profissional_id
         WHERE a.data_atendimento = $1
           AND a.profissional_id = $2
           AND a.id <> $3
           AND a.status <> 'cancelado'
           AND a.hora_atendimento < $4::time + make_interval(mins => $5)
           AND a.hora_atendimento + make_interval(mins => s.duracao_minutos) > $4::time
         LIMIT 1`,
        [data, profissionalId, ignorarId, hora, duracao]
    );
    return resultado.rows[0] ?? null;
}

function mensagemDeConflito(conflito) {
    return `Horário ocupado: ${conflito.profissional} já tem ${conflito.tipo_servico} às ${conflito.hora} nesse dia.`;
}

// Confere os dados do atendimento antes de salvar.
// Devolve { erro } se algo estiver errado, ou { dados } prontos para o banco.
// Em um atendimento novo o servico precisa estar ativo; ao editar um
// atendimento antigo, um servico que foi desativado depois ainda vale.
// O id (ao editar) serve para o atendimento nao conflitar com ele mesmo.
async function prepararAtendimento(corpo, { novo, id = 0 }) {
    const { cliente_id, servico_id, profissional_id, data_atendimento, hora_atendimento } = corpo;
    const animal_id = corpo.animal_id || null;
    const observacoes = corpo.observacoes || null;

    if (!cliente_id || !servico_id || !profissional_id || !data_atendimento || !hora_atendimento) {
        return { erro: 'Informe cliente, serviço, profissional, data e horário.' };
    }

    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(hora_atendimento)) {
        return { erro: 'Horário inválido. Use o formato HH:MM.' };
    }

    // Sem status informado: data que ja passou entra como concluido, o resto como agendado
    const status = corpo.status || (String(data_atendimento).slice(0, 10) < hojeISO() ? 'concluido' : 'agendado');
    if (!STATUS.includes(status)) {
        return { erro: 'Status inválido.' };
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

    // O profissional precisa ser da funcao que realiza o servico
    // (tosador faz banho e tosa, veterinario faz consulta e vacina)
    const profissionalResultado = await pool.query('SELECT * FROM profissionais WHERE id = $1', [profissional_id]);
    const profissional = profissionalResultado.rows[0];

    if (!profissional || (novo && !profissional.ativo)) {
        return { erro: 'Profissional inválido ou inativo.' };
    }

    if (profissional.funcao !== servico.funcao) {
        return { erro: `${profissional.nome} não realiza ${servico.nome}.` };
    }

    // Sem valor informado, cobra o preco do catalogo
    const valor = corpo.valor === undefined || corpo.valor === null || corpo.valor === ''
        ? servico.preco
        : Number(corpo.valor);

    if (isNaN(valor) || valor < 0) {
        return { erro: 'Informe um valor válido (zero ou maior).' };
    }

    const inicio = emMinutos(hora_atendimento);
    if (inicio < ABERTURA || inicio + servico.duracao_minutos > FECHAMENTO) {
        return { erro: `Esse serviço dura ${servico.duracao_minutos} min e precisa caber entre 09:00 e 17:00.` };
    }

    // Um atendimento cancelado nao ocupa a agenda, entao nao precisa conferir conflito
    if (status !== 'cancelado') {
        const conflito = await conflitoNaAgenda({
            data: data_atendimento,
            profissionalId: profissional.id,
            ignorarId: id,
            hora: hora_atendimento,
            duracao: servico.duracao_minutos
        });
        if (conflito) {
            return { erro: mensagemDeConflito(conflito) };
        }
    }

    return {
        dados: [cliente_id, animal_id, servico.id, servico.nome, valor, data_atendimento, hora_atendimento, observacoes, profissional.id, status]
    };
}

async function criarAtendimento(req, res) {
    try {
        const { erro, dados } = await prepararAtendimento(req.body, { novo: true });
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            `INSERT INTO atendimentos (cliente_id, animal_id, servico_id, tipo_servico, valor, data_atendimento, hora_atendimento, observacoes, profissional_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
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
                'SELECT * FROM atendimentos WHERE cliente_id = $1 ORDER BY data_atendimento DESC, hora_atendimento',
                [cliente_id]
            );
        } else {
            resultado = await pool.query('SELECT * FROM atendimentos ORDER BY data_atendimento DESC, hora_atendimento');
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
        const { erro, dados } = await prepararAtendimento(req.body, { novo: false, id });
        if (erro) {
            return res.status(400).json({ erro });
        }

        const resultado = await pool.query(
            `UPDATE atendimentos
             SET cliente_id = $1, animal_id = $2, servico_id = $3, tipo_servico = $4, valor = $5,
                 data_atendimento = $6, hora_atendimento = $7, observacoes = $8, profissional_id = $9, status = $10
             WHERE id = $11 RETURNING *`,
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

// Troca so o status (botoes Concluir, Faltou e Cancelar).
// Reativar um atendimento cancelado volta a ocupar a agenda, entao
// nesse caso confere se o horario ainda esta livre.
async function atualizarStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUS.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido.' });
    }

    try {
        const atual = await pool.query(
            `SELECT a.*, s.duracao_minutos
             FROM atendimentos a JOIN servicos s ON s.id = a.servico_id
             WHERE a.id = $1`,
            [id]
        );
        const atendimento = atual.rows[0];

        if (!atendimento) {
            return res.status(404).json({ erro: 'Atendimento não encontrado' });
        }

        if (atendimento.status === 'cancelado' && status !== 'cancelado') {
            const conflito = await conflitoNaAgenda({
                data: atendimento.data_atendimento,
                profissionalId: atendimento.profissional_id,
                ignorarId: atendimento.id,
                hora: atendimento.hora_atendimento,
                duracao: atendimento.duracao_minutos
            });
            if (conflito) {
                return res.status(400).json({ erro: mensagemDeConflito(conflito) });
            }
        }

        const resultado = await pool.query(
            'UPDATE atendimentos SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o status do atendimento' });
    }
}

// Cliente inativo: sem atendimento concluido ou agendado ha mais de 60 dias
// (cancelados e faltas nao contam como visita)
async function listarClientesInativos(req, res) {
    try {
        const resultado = await pool.query(`
            SELECT
                c.id,
                c.nome,
                c.telefone,
                MAX(a.data_atendimento) AS ultimo_atendimento
            FROM clientes c
            LEFT JOIN atendimentos a ON a.cliente_id = c.id AND a.status IN ('agendado', 'concluido')
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

module.exports = { criarAtendimento, listarAtendimentos, atualizarAtendimento, atualizarStatus, listarClientesInativos };
