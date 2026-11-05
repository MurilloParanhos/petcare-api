const pool = require('../config/db');
const { obterRegras, validarRegras } = require('../regrasAgenda');

async function obterRegrasDaAgenda(req, res) {
    try {
        res.json(await obterRegras());
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao carregar as configurações da agenda.' });
    }
}

// Mudar as regras vale para os proximos agendamentos; os atendimentos que
// ja existem continuam onde estao
async function atualizarRegrasDaAgenda(req, res) {
    const { abertura, fechamento, almoco, diasFechados, intervaloMinutos } = req.body;
    const regras = {
        abertura,
        fechamento,
        almoco: { inicio: almoco?.inicio, fim: almoco?.fim },
        diasFechados: [...new Set(diasFechados ?? [])].sort(),
        intervaloMinutos: Number(intervaloMinutos)
    };

    const erro = validarRegras(regras);
    if (erro) {
        return res.status(400).json({ erro });
    }

    try {
        await pool.query(
            `INSERT INTO configuracoes (chave, valor) VALUES ('agenda', $1)
             ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
            [JSON.stringify(regras)]
        );
        res.json(regras);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar as configurações da agenda.' });
    }
}

module.exports = { obterRegrasDaAgenda, atualizarRegrasDaAgenda };
