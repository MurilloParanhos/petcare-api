// Regras da agenda: horario de funcionamento, intervalo entre horarios,
// pausa para almoco e dias fechados. Comecam com os valores padrao de
// shared/regrasAgenda.json e sao trocadas pelas da tela Configuracoes
// (vindas da API) com aplicarRegras(), quando o sistema abre ou quando
// alguem salva novas regras.
// Cada profissional tem a sua agenda: dois atendimentos no mesmo horario
// sao possiveis se forem com profissionais diferentes.
// Os horarios sao trabalhados em minutos desde a meia-noite (09:00 = 540).
import regrasPadrao from '../../shared/regrasAgenda.json';

// "let" exportado: quem importa sempre enxerga o valor atual depois de aplicarRegras()
export let ABERTURA;
export let FECHAMENTO;
export let INTERVALO;
export let ALMOCO_INICIO;
export let ALMOCO_FIM;
// Dias da semana sem atendimento (0 = domingo, como no getDay() do JavaScript)
export let DIAS_FECHADOS;
// As regras como vieram ("09:00", "17:00"...), para mostrar na tela
export let REGRAS;

export function aplicarRegras(regras) {
    REGRAS = regras;
    ABERTURA = emMinutos(regras.abertura);
    FECHAMENTO = emMinutos(regras.fechamento);
    INTERVALO = Number(regras.intervaloMinutos);
    ALMOCO_INICIO = emMinutos(regras.almoco.inicio);
    ALMOCO_FIM = emMinutos(regras.almoco.fim);
    DIAS_FECHADOS = regras.diasFechados;
}

aplicarRegras(regrasPadrao);

const NOMES_DOS_DIAS = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];

// "2026-11-01" e domingo? -> true
export function diaFechado(data) {
    return DIAS_FECHADOS.includes(new Date(`${data}T00:00:00`).getDay());
}

// "Fechado aos domingos" (ou aos dias que estiverem configurados)
export function textoDiasFechados() {
    return DIAS_FECHADOS.map((dia) => NOMES_DOS_DIAS[dia]).join(' e ');
}

// O atendimento [inicio, fim) pega algum pedaco do almoco?
export function pegaOAlmoco(inicio, fim) {
    return inicio < ALMOCO_FIM && ALMOCO_INICIO < fim;
}

export const NOMES_DAS_FUNCOES = { tosador: 'Banho e tosa', veterinario: 'Veterinária' };

// Nome e classe CSS (cor) de cada status do atendimento
export const STATUS_DO_ATENDIMENTO = {
    agendado: { nome: 'Agendado', classe: 'status-agendado' },
    concluido: { nome: 'Concluído', classe: 'status-concluido' },
    cancelado: { nome: 'Cancelado', classe: 'status-cancelado' },
    faltou: { nome: 'Faltou', classe: 'status-faltou' }
};

// "Concluir" e "Faltou" so fazem sentido a partir do dia do atendimento
// (a API tambem recusa antes disso)
export function jaChegouODia(atendimento) {
    return dataISO(atendimento.data_atendimento) <= dataISO(new Date());
}

// Agendado com data que ja passou: ficou sem baixa (nao foi concluido nem cancelado)
export function estaAtrasado(atendimento) {
    return atendimento.status === 'agendado' && dataISO(atendimento.data_atendimento) < dataISO(new Date());
}

// "09:30" ou "09:30:00" (formato do PostgreSQL) -> 570
export function emMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

// 570 -> "09:30"
export function horaTexto(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0');
    const m = String(minutos % 60).padStart(2, '0');
    return `${h}:${m}`;
}

// Data do banco (ou Date) -> "2026-11-02", no fuso do navegador
export function dataISO(valor) {
    const data = new Date(valor);
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
}

function duracaoDoServico(servicos, servicoId) {
    return servicos.find((s) => s.id === Number(servicoId))?.duracao_minutos ?? 60;
}

// Intervalos ja ocupados na agenda de um profissional nesse dia
// (atendimento cancelado libera o horario)
function ocupadosDoProfissional({ data, profissionalId, atendimentos, servicos, ignorarId }) {
    return atendimentos
        .filter((a) =>
            a.id !== ignorarId &&
            a.status !== 'cancelado' &&
            a.profissional_id === profissionalId &&
            a.hora_atendimento &&
            dataISO(a.data_atendimento) === data
        )
        .map((a) => {
            const inicio = emMinutos(a.hora_atendimento);
            return [inicio, inicio + duracaoDoServico(servicos, a.servico_id)];
        });
}

// Profissionais (da lista recebida) que estao livres nesse horario
export function profissionaisLivres({ data, hora, duracao, profissionais, atendimentos, servicos, ignorarId }) {
    const inicio = emMinutos(hora);
    const fim = inicio + duracao;

    return profissionais.filter((p) => {
        const ocupados = ocupadosDoProfissional({ data, profissionalId: p.id, atendimentos, servicos, ignorarId });
        // Dois intervalos se sobrepoem quando um comeca antes do outro terminar
        return !ocupados.some(([oInicio, oFim]) => inicio < oFim && oInicio < fim);
    });
}

// Horarios em que pelo menos um dos profissionais esta livre durante todo o servico.
// ignorarId: o atendimento que esta sendo editado.
export function horariosLivres({ data, duracao, profissionais, atendimentos, servicos, ignorarId }) {
    if (diaFechado(data)) return [];

    const livres = [];
    for (let inicio = ABERTURA; inicio + duracao <= FECHAMENTO; inicio += INTERVALO) {
        if (pegaOAlmoco(inicio, inicio + duracao)) continue;
        const hora = horaTexto(inicio);
        if (profissionaisLivres({ data, hora, duracao, profissionais, atendimentos, servicos, ignorarId }).length > 0) {
            livres.push(hora);
        }
    }
    return livres;
}

// "09:00 – 10:30"
export function faixaDeHorario(atendimento, servicos) {
    if (!atendimento.hora_atendimento) return '-';
    const inicio = emMinutos(atendimento.hora_atendimento);
    const fim = inicio + duracaoDoServico(servicos, atendimento.servico_id);
    return `${horaTexto(inicio)} – ${horaTexto(fim)}`;
}

// Para ordenar por data e hora juntos: "2026-11-02 09:00"
export function chaveDeOrdem(atendimento) {
    return `${dataISO(atendimento.data_atendimento)} ${(atendimento.hora_atendimento ?? '').slice(0, 5)}`;
}
