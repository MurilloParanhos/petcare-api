// Regras da agenda: funcionamento das 09:00 as 17:00, horarios de 30 em 30 min.
// Os horarios sao trabalhados em minutos desde a meia-noite (09:00 = 540).

export const ABERTURA = 9 * 60;
export const FECHAMENTO = 17 * 60;
export const INTERVALO = 30;

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

// Horarios em que um servico com essa duracao cabe no dia sem encavalar
// com outro atendimento. ignorarId: o atendimento que esta sendo editado.
export function horariosLivres({ data, duracao, atendimentos, servicos, ignorarId }) {
    const ocupados = atendimentos
        .filter((a) => a.id !== ignorarId && a.hora_atendimento && dataISO(a.data_atendimento) === data)
        .map((a) => {
            const inicio = emMinutos(a.hora_atendimento);
            return [inicio, inicio + duracaoDoServico(servicos, a.servico_id)];
        });

    const livres = [];
    for (let inicio = ABERTURA; inicio + duracao <= FECHAMENTO; inicio += INTERVALO) {
        const fim = inicio + duracao;
        // Dois intervalos se sobrepoem quando um comeca antes do outro terminar
        const sobrepoe = ocupados.some(([oInicio, oFim]) => inicio < oFim && oInicio < fim);
        if (!sobrepoe) livres.push(horaTexto(inicio));
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
