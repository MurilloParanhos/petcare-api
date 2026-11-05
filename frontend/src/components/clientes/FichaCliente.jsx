import { formatarMoeda, formatarTelefone, normalizar } from '../../utils';
import { chaveDeOrdem, dataISO, faixaDeHorario, STATUS_DO_ATENDIMENTO } from '../../agenda';
import { situacaoDaDose, ultimasDoses } from '../../vacinas';

const ICONES_DAS_ESPECIES = { cachorro: 'fa-dog', gato: 'fa-cat' };

function formatarData(valor) {
    return valor ? new Date(valor).toLocaleDateString('pt-BR') : '-';
}

// Tudo de um cliente numa tela so: contato, numeros, pets com a situacao das
// vacinas e o historico completo de atendimentos
function FichaCliente({ cliente, animais, atendimentos, vacinas, servicos, profissionais, onVoltar, onEditar, onAgendar }) {
    const hoje = dataISO(new Date());
    const pets = animais.filter((a) => a.cliente_id === cliente.id);
    const historico = atendimentos
        .filter((a) => a.cliente_id === cliente.id)
        .sort((a, b) => chaveDeOrdem(b).localeCompare(chaveDeOrdem(a)));

    const concluidos = historico.filter((a) => a.status === 'concluido');
    const totalGasto = concluidos.reduce((soma, a) => soma + Number(a.valor ?? 0), 0);
    const ultimaVisita = concluidos[0];
    const proximo = historico
        .filter((a) => a.status === 'agendado' && dataISO(a.data_atendimento) >= hoje)
        .sort((a, b) => chaveDeOrdem(a).localeCompare(chaveDeOrdem(b)))[0];
    const faltas = historico.filter((a) => a.status === 'faltou').length;

    const nomeDoPet = (id) => animais.find((a) => a.id === id)?.nome ?? '-';
    const nomeDoProfissional = (id) => profissionais.find((p) => p.id === id)?.nome ?? '-';

    return (
        <div>
            <button className="btn-secundario ficha-voltar" onClick={onVoltar}>
                <i className="fa-solid fa-arrow-left"></i> Voltar para a lista
            </button>

            <div className="ficha-topo">
                <div>
                    <h2>{cliente.nome}</h2>
                    <p className="subtitulo-aba">
                        {formatarTelefone(cliente.telefone) || 'Sem telefone'} · {cliente.email || 'Sem email'}
                    </p>
                </div>
                <div className="ficha-acoes">
                    <button className="btn-secundario" onClick={() => onEditar(cliente)}>Editar dados</button>
                    <button className="btn-concluir" onClick={() => onAgendar(cliente)}>Agendar atendimento</button>
                </div>
            </div>

            <section className="cards">
                <div className="card">
                    <h3>Total gasto</h3>
                    <p>{formatarMoeda(totalGasto)}</p>
                    <span className="card-detalhe">{concluidos.length} atendimento(s) concluído(s)</span>
                </div>
                <div className="card">
                    <h3>Última visita</h3>
                    <p>{ultimaVisita ? formatarData(ultimaVisita.data_atendimento) : '-'}</p>
                    <span className="card-detalhe">{ultimaVisita ? ultimaVisita.tipo_servico : 'Nunca atendido'}</span>
                </div>
                <div className="card">
                    <h3>Próximo agendamento</h3>
                    <p>{proximo ? formatarData(proximo.data_atendimento) : '-'}</p>
                    <span className="card-detalhe">
                        {proximo ? `${faixaDeHorario(proximo, servicos)} · ${proximo.tipo_servico}` : 'Nenhum agendado'}
                    </span>
                </div>
                <div className={faltas > 0 ? 'card card-alerta' : 'card'}>
                    <h3>Faltas</h3>
                    <p>{faltas}</p>
                    <span className="card-detalhe">em {historico.length} atendimento(s)</span>
                </div>
            </section>

            <h3 className="ficha-secao">Pets</h3>
            {pets.length === 0 ? (
                <p className="painel-vazio">Nenhum pet cadastrado para este cliente.</p>
            ) : (
                <section className="ficha-pets">
                    {pets.map((pet) => {
                        const icone = ICONES_DAS_ESPECIES[normalizar(pet.especie)];
                        const vacinasDoPet = ultimasDoses(vacinas.filter((v) => v.animal_id === pet.id));
                        return (
                            <div key={pet.id} className="painel">
                                <h3 className="especie">
                                    {icone && <i className={`fa-solid ${icone}`}></i>}
                                    {pet.nome}
                                </h3>
                                <p className="painel-subtitulo">
                                    {[pet.especie, pet.raca, pet.idade !== null ? `${pet.idade} ano(s)` : null].filter(Boolean).join(' · ')}
                                </p>
                                {vacinasDoPet.length === 0 ? (
                                    <p className="painel-vazio">Nenhuma vacina registrada.</p>
                                ) : (
                                    <ul className="ficha-vacinas">
                                        {vacinasDoPet.map((v) => {
                                            const situacao = situacaoDaDose(v.proxima_dose, hoje);
                                            return (
                                                <li key={v.id}>
                                                    <span>{v.nome}</span>
                                                    <span className={`selo ${situacao.classe}`}>{situacao.texto}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </section>
            )}

            <h3 className="ficha-secao">Histórico de atendimentos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Pet</th>
                        <th>Serviço</th>
                        <th>Profissional</th>
                        <th>Status</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {historico.map((a) => (
                        <tr key={a.id} className={`linha-${a.status}`}>
                            <td>{formatarData(a.data_atendimento)}</td>
                            <td className="sem-quebra">{faixaDeHorario(a, servicos)}</td>
                            <td>{nomeDoPet(a.animal_id)}</td>
                            <td>{a.tipo_servico}</td>
                            <td>{nomeDoProfissional(a.profissional_id)}</td>
                            <td>
                                <span className={`selo ${STATUS_DO_ATENDIMENTO[a.status].classe}`}>{STATUS_DO_ATENDIMENTO[a.status].nome}</span>
                            </td>
                            <td>{formatarMoeda(a.valor)}</td>
                        </tr>
                    ))}
                    {historico.length === 0 && (
                        <tr>
                            <td colSpan="7">Nenhum atendimento ainda.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default FichaCliente;
