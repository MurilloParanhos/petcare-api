// Regras das vacinas usadas pela aba Vacinas e pela ficha do cliente
import { normalizar } from './utils';
import { dataISO } from './agenda';

function diasEntre(de, ate) {
    return Math.round((new Date(`${ate}T00:00:00`) - new Date(`${de}T00:00:00`)) / 86400000);
}

// So conta a dose mais recente de cada vacina de cada pet: se a V10 ja foi
// reaplicada, a dose antiga nao avisa mais
export function ultimasDoses(vacinas) {
    const ultimas = {};
    vacinas.forEach((vacina) => {
        const chave = `${vacina.animal_id}|${normalizar(vacina.nome)}`;
        const atual = ultimas[chave];
        if (!atual || dataISO(vacina.data_aplicacao) > dataISO(atual.data_aplicacao)) ultimas[chave] = vacina;
    });
    return Object.values(ultimas);
}

// "Atrasada ha 3 dias", "Vence hoje", "Vence em 12 dias" ou "Em dia", com a cor do aviso
export function situacaoDaDose(proximaDose, hoje, diasDeAviso = 30) {
    if (!proximaDose) return { texto: 'Dose única', classe: 'status-cancelado' };
    const dias = diasEntre(hoje, dataISO(proximaDose));
    if (dias < 0) return { texto: `Atrasada há ${-dias} dia(s)`, classe: 'status-faltou' };
    if (dias === 0) return { texto: 'Vence hoje', classe: 'status-faltou' };
    if (dias <= diasDeAviso) return { texto: `Vence em ${dias} dia(s)`, classe: 'status-agendado' };
    return { texto: 'Em dia', classe: 'status-concluido' };
}
