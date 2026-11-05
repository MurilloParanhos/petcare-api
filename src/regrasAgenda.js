// Regras da agenda (horario de funcionamento, almoco, intervalo e dias
// fechados). Ficam na tabela configuracoes, editaveis pela tela; o arquivo
// shared/regrasAgenda.json tem os valores padrao, usados se o banco nao tiver.
const pool = require('./config/db');
const PADRAO = require('../shared/regrasAgenda.json');

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const INTERVALOS = [15, 30, 60];
const NOMES_DOS_DIAS = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];

function emMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

// Le as regras do banco. Aceita um cliente de transacao (usado pelo script de dados de teste)
async function obterRegras(conexao = pool) {
    const resultado = await conexao.query("SELECT valor FROM configuracoes WHERE chave = 'agenda'");
    return resultado.rows[0]?.valor ?? PADRAO;
}

// Os horarios das regras convertidos para minutos desde a meia-noite (09:00 = 540)
function emMinutosDasRegras(regras) {
    return {
        abertura: emMinutos(regras.abertura),
        fechamento: emMinutos(regras.fechamento),
        almocoInicio: emMinutos(regras.almoco.inicio),
        almocoFim: emMinutos(regras.almoco.fim),
        diasFechados: regras.diasFechados
    };
}

// Confere regras novas antes de salvar. Devolve a mensagem de erro ou null.
function validarRegras(regras) {
    const { abertura, fechamento, almoco, diasFechados, intervaloMinutos } = regras ?? {};

    if (![abertura, fechamento, almoco?.inicio, almoco?.fim].every((hora) => HORA.test(hora ?? ''))) {
        return 'Informe todos os horários no formato HH:MM.';
    }
    if (emMinutos(abertura) >= emMinutos(fechamento)) {
        return 'O horário de abertura precisa ser antes do fechamento.';
    }
    if (emMinutos(almoco.inicio) >= emMinutos(almoco.fim)) {
        return 'O início do almoço precisa ser antes do fim.';
    }
    if (emMinutos(almoco.inicio) < emMinutos(abertura) || emMinutos(almoco.fim) > emMinutos(fechamento)) {
        return 'O almoço precisa ficar dentro do horário de funcionamento.';
    }
    if (!INTERVALOS.includes(Number(intervaloMinutos))) {
        return 'O intervalo entre horários precisa ser de 15, 30 ou 60 minutos.';
    }
    if (!Array.isArray(diasFechados) || diasFechados.some((dia) => !Number.isInteger(dia) || dia < 0 || dia > 6)) {
        return 'Dias fechados inválidos.';
    }
    if (new Set(diasFechados).size >= 7) {
        return 'O pet shop precisa abrir pelo menos um dia na semana.';
    }
    return null;
}

module.exports = { obterRegras, emMinutos, emMinutosDasRegras, validarRegras, NOMES_DOS_DIAS };
