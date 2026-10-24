import { useState } from 'react';
import { formatarMoeda, formatarTelefone } from '../utils';
import {
    ABERTURA, FECHAMENTO, INTERVALO, NOMES_DAS_FUNCOES, STATUS_DO_ATENDIMENTO,
    dataISO, emMinutos, faixaDeHorario, horaTexto
} from '../agenda';
import CampoData from './CampoData';

// Altura, em pixels, de cada faixa de 30 minutos na grade
const ALTURA_DA_FAIXA = 48;

const FAIXAS = [];
for (let inicio = ABERTURA; inicio < FECHAMENTO; inicio += INTERVALO) FAIXAS.push(inicio);

// "2026-11-02" mais (ou menos) alguns dias
function somarDias(data, dias) {
    const nova = new Date(`${data}T00:00:00`);
    nova.setDate(nova.getDate() + dias);
    return dataISO(nova);
}

// Agenda do dia: uma coluna por profissional e uma linha a cada 30 minutos,
// com cada atendimento desenhado como um bloco do tamanho da sua duracao.
function Agenda({ atendimentos, clientes, animais, servicos, profissionais, mudarStatus, onAgendar }) {
    const [data, setData] = useState(() => dataISO(new Date()));
    const [selecionadoId, setSelecionadoId] = useState(null);

    const hoje = dataISO(new Date());
    const equipe = profissionais.filter((p) => p.ativo);

    const doDia = atendimentos.filter((a) => dataISO(a.data_atendimento) === data && a.hora_atendimento);
    // Cancelados nao aparecem na grade: o horario deles esta livre
    const naGrade = doDia.filter((a) => a.status !== 'cancelado');
    const cancelados = doDia.length - naGrade.length;
    const previsto = naGrade
        .filter((a) => a.status !== 'faltou')
        .reduce((soma, a) => soma + Number(a.valor ?? 0), 0);

    const selecionado = doDia.find((a) => a.id === selecionadoId);

    function duracao(atendimento) {
        return servicos.find((s) => s.id === atendimento.servico_id)?.duracao_minutos ?? 60;
    }

    function nomeDoCliente(clienteId) {
        return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
    }

    function nomeDoAnimal(animalId) {
        return animais.find((a) => a.id === animalId)?.nome;
    }

    // Uma faixa esta livre para o profissional se nenhum atendimento dele a ocupa
    function faixaLivre(profissionalId, inicio) {
        return !naGrade.some((a) => {
            if (a.profissional_id !== profissionalId) return false;
            const aInicio = emMinutos(a.hora_atendimento);
            return aInicio < inicio + INTERVALO && inicio < aInicio + duracao(a);
        });
    }

    function trocarDia(novaData) {
        setData(novaData);
        setSelecionadoId(null);
    }

    // Linha vermelha marcando a hora atual, so no dia de hoje e dentro do expediente
    const agora = new Date();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const mostrarAgora = data === hoje && minutosAgora >= ABERTURA && minutosAgora <= FECHAMENTO;

    // "segunda-feira, 26 de outubro de 2026" -> so a primeira letra maiuscula
    const extenso = new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const dataPorExtenso = extenso.charAt(0).toUpperCase() + extenso.slice(1);

    return (
        <div>
            <h2>Agenda do dia</h2>

            <div className="agenda-navegacao">
                <button className="btn-secundario" onClick={() => trocarDia(somarDias(data, -1))} title="Dia anterior">
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button className="btn-secundario" onClick={() => trocarDia(hoje)} disabled={data === hoje}>Hoje</button>
                <button className="btn-secundario" onClick={() => trocarDia(somarDias(data, 1))} title="Próximo dia">
                    <i className="fa-solid fa-chevron-right"></i>
                </button>
                <div className="agenda-data">
                    <CampoData id="agendaData" valor={data} onChange={(nova) => nova && trocarDia(nova)} />
                </div>
                <span className="agenda-extenso">{dataPorExtenso}</span>
            </div>

            <p className="subtitulo-aba">
                {naGrade.length} atendimento(s) · {formatarMoeda(previsto)} previsto
                {cancelados > 0 && ` · ${cancelados} cancelado(s)`}
                {' · '}Clique num horário livre para agendar.
            </p>

            <div className="agenda-rolagem">
                <div className="agenda" style={{ gridTemplateColumns: `60px repeat(${equipe.length}, minmax(170px, 1fr))` }}>
                    <div className="agenda-canto"></div>
                    {equipe.map((p) => (
                        <div key={p.id} className="agenda-cabecalho">
                            <strong>{p.nome}</strong>
                            <span>{NOMES_DAS_FUNCOES[p.funcao]}</span>
                        </div>
                    ))}

                    <div className="agenda-horas" style={{ height: FAIXAS.length * ALTURA_DA_FAIXA }}>
                        {FAIXAS.map((inicio) => (
                            <span key={inicio} style={{ top: (inicio - ABERTURA) / INTERVALO * ALTURA_DA_FAIXA }}>
                                {horaTexto(inicio)}
                            </span>
                        ))}
                        <span className="agenda-fim" style={{ top: FAIXAS.length * ALTURA_DA_FAIXA }}>
                            {horaTexto(FECHAMENTO)}
                        </span>
                    </div>

                    {equipe.map((p) => (
                        <div key={p.id} className="agenda-coluna" style={{ height: FAIXAS.length * ALTURA_DA_FAIXA }}>
                            {FAIXAS.map((inicio) => faixaLivre(p.id, inicio) && (
                                <button
                                    key={inicio}
                                    className="agenda-livre"
                                    style={{ top: (inicio - ABERTURA) / INTERVALO * ALTURA_DA_FAIXA, height: ALTURA_DA_FAIXA }}
                                    onClick={() => onAgendar({ data_atendimento: data, hora_atendimento: horaTexto(inicio), profissional_id: p.id })}
                                    title={`Agendar com ${p.nome} às ${horaTexto(inicio)}`}
                                >
                                    + {horaTexto(inicio)}
                                </button>
                            ))}

                            {naGrade.filter((a) => a.profissional_id === p.id).map((a) => {
                                const clienteEPet = `${nomeDoCliente(a.cliente_id)}${nomeDoAnimal(a.animal_id) ? ` · ${nomeDoAnimal(a.animal_id)}` : ''}`;
                                // Bloco de 30 min so tem espaco para 2 linhas: o servico sobe para a linha do horario
                                const curto = duracao(a) <= INTERVALO;

                                return (
                                    <button
                                        key={a.id}
                                        className={`agenda-bloco ${STATUS_DO_ATENDIMENTO[a.status].classe} ${a.id === selecionadoId ? 'selecionado' : ''}`}
                                        style={{
                                            top: (emMinutos(a.hora_atendimento) - ABERTURA) / INTERVALO * ALTURA_DA_FAIXA,
                                            height: duracao(a) / INTERVALO * ALTURA_DA_FAIXA - 4
                                        }}
                                        onClick={() => setSelecionadoId(a.id)}
                                        title={`${faixaDeHorario(a, servicos)} · ${a.tipo_servico} · ${clienteEPet}`}
                                    >
                                        <strong>{faixaDeHorario(a, servicos)}{curto && ` · ${a.tipo_servico}`}</strong>
                                        <span>{clienteEPet}</span>
                                        {!curto && <span>{a.tipo_servico}</span>}
                                    </button>
                                );
                            })}

                            {mostrarAgora && (
                                <div className="agenda-agora" style={{ top: (minutosAgora - ABERTURA) / INTERVALO * ALTURA_DA_FAIXA }}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {selecionado && (
                <section className="painel agenda-detalhe">
                    <div className="agenda-detalhe-topo">
                        <h3>{selecionado.tipo_servico} · {faixaDeHorario(selecionado, servicos)}</h3>
                        <span className={`selo ${STATUS_DO_ATENDIMENTO[selecionado.status].classe}`}>
                            {STATUS_DO_ATENDIMENTO[selecionado.status].nome}
                        </span>
                    </div>
                    <p>
                        <strong>{nomeDoCliente(selecionado.cliente_id)}</strong>
                        {nomeDoAnimal(selecionado.animal_id) && ` com ${nomeDoAnimal(selecionado.animal_id)}`}
                        {' · '}{formatarTelefone(clientes.find((c) => c.id === selecionado.cliente_id)?.telefone) || 'sem telefone'}
                    </p>
                    <p>
                        {profissionais.find((p) => p.id === selecionado.profissional_id)?.nome}
                        {' · '}{formatarMoeda(selecionado.valor)}
                        {selecionado.observacoes && ` · ${selecionado.observacoes}`}
                    </p>
                    <div className="agenda-detalhe-acoes">
                        {selecionado.status === 'agendado' ? (
                            <>
                                <button className="btn-concluir" onClick={() => mudarStatus(selecionado, 'concluido')}>Concluir</button>
                                <button className="btn-secundario" onClick={() => mudarStatus(selecionado, 'faltou')}>Faltou</button>
                                <button className="btn-excluir" onClick={() => mudarStatus(selecionado, 'cancelado')}>Cancelar</button>
                            </>
                        ) : (
                            <button className="btn-secundario" onClick={() => mudarStatus(selecionado, 'agendado')}>Reabrir</button>
                        )}
                        <button className="btn-secundario" onClick={() => setSelecionadoId(null)}>Fechar</button>
                    </div>
                </section>
            )}
        </div>
    );
}

export default Agenda;
