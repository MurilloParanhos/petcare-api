import { useState } from 'react';
import { formatarMoeda, normalizar, paginar } from '../../utils';
import { chaveDeOrdem, estaAtrasado, faixaDeHorario, STATUS_DO_ATENDIMENTO } from '../../agenda';
import Paginacao from '../Paginacao';
import CampoSelecao from '../CampoSelecao';

// Filtros da lista: cada um mostra os atendimentos com esses status
const FILTROS_DE_STATUS = [
    { id: 'agendados', nome: 'Agendados', status: ['agendado'] },
    { id: 'concluidos', nome: 'Concluídos', status: ['concluido'] },
    { id: 'cancelados', nome: 'Cancelados e faltas', status: ['cancelado', 'faltou'] },
    { id: 'todos', nome: 'Todos', status: ['agendado', 'concluido', 'cancelado', 'faltou'] }
];

const ICONES_DAS_ESPECIES = { cachorro: 'fa-dog', gato: 'fa-cat' };

// Busca, filtros, tabela e paginacao dos atendimentos.
// Os filtros sao estado so desta tabela; editar e mudar status sobem para quem usa.
function TabelaAtendimentos({ atendimentos, clientes, animais, servicos, profissionais, onEditar, mudarStatus }) {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('agendados');
    const [servico, setServico] = useState('');
    const [pagina, setPagina] = useState(1);

    function nomeDoCliente(clienteId) {
        return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
    }

    function nomeDoAnimal(animalId) {
        return animais.find((a) => a.id === animalId)?.nome ?? '-';
    }

    function nomeDoProfissional(profissionalId) {
        return profissionais.find((p) => p.id === profissionalId)?.nome ?? '';
    }

    // Icone de cachorro ou gato ao lado da especie; outras especies so com o texto
    function especieDoAnimal(animalId) {
        const especie = animais.find((a) => a.id === animalId)?.especie;
        if (!especie) return '-';

        const icone = ICONES_DAS_ESPECIES[normalizar(especie)];
        return (
            <span className="especie">
                {icone && <i className={`fa-solid ${icone}`}></i>}
                {especie}
            </span>
        );
    }

    const filtrados = atendimentos
        .filter((a) => FILTROS_DE_STATUS.find((f) => f.id === filtroStatus).status.includes(a.status))
        .filter((a) => [nomeDoCliente(a.cliente_id), nomeDoAnimal(a.animal_id)].some((campo) => normalizar(campo).includes(normalizar(busca))))
        .filter((a) => !servico || a.servico_id === Number(servico))
        .sort((a, b) => {
            const diferenca = chaveDeOrdem(a).localeCompare(chaveDeOrdem(b));
            // Agendados: o mais proximo primeiro (os atrasados aparecem no topo). Os outros: o mais recente primeiro
            return filtroStatus === 'agendados' ? diferenca : -diferenca;
        });

    const paginacao = paginar(filtrados, pagina);

    // Qualquer filtro novo volta para a primeira pagina
    function filtrar(setFiltro) {
        return (valor) => {
            setFiltro(valor);
            setPagina(1);
        };
    }

    return (
        <>
            <div className="filtros">
                <input
                    type="search"
                    placeholder="Buscar por cliente ou pet..."
                    value={busca}
                    onChange={(e) => filtrar(setBusca)(e.target.value)}
                />
                <div className="grupo-botoes">
                    {FILTROS_DE_STATUS.map((f) => (
                        <button
                            key={f.id}
                            className={filtroStatus === f.id ? 'ativo' : ''}
                            onClick={() => filtrar(setFiltroStatus)(f.id)}
                        >
                            {f.nome}
                        </button>
                    ))}
                </div>
                <CampoSelecao
                    id="filtroServico"
                    valor={servico}
                    opcoes={[
                        { valor: '', rotulo: 'Todos os serviços' },
                        ...servicos.map((s) => ({ valor: s.id, rotulo: s.nome }))
                    ]}
                    onChange={filtrar(setServico)}
                    buscavel={false}
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Pet</th>
                        <th>Serviço</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Status</th>
                        <th>Observações</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {paginacao.itens.map((atendimento) => (
                        <tr key={atendimento.id} className={`linha-${atendimento.status}`}>
                            <td>{nomeDoCliente(atendimento.cliente_id)}</td>
                            <td>
                                {nomeDoAnimal(atendimento.animal_id)}
                                <span className="detalhe-celula">{especieDoAnimal(atendimento.animal_id)}</span>
                            </td>
                            <td>{atendimento.tipo_servico}</td>
                            <td>{formatarMoeda(atendimento.valor)}</td>
                            <td>{new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR')}</td>
                            <td className="sem-quebra">
                                {faixaDeHorario(atendimento, servicos)}
                                <span className="detalhe-celula">{nomeDoProfissional(atendimento.profissional_id)}</span>
                            </td>
                            <td>
                                <span className={`selo ${STATUS_DO_ATENDIMENTO[atendimento.status].classe}`}>
                                    {STATUS_DO_ATENDIMENTO[atendimento.status].nome}
                                </span>
                                {estaAtrasado(atendimento) && <span className="detalhe-celula alerta">Sem baixa</span>}
                            </td>
                            <td>{atendimento.observacoes ?? '-'}</td>
                            <td className="acoes">
                                <button className="btn-editar" onClick={() => onEditar(atendimento)}>Editar</button>
                                {atendimento.status === 'agendado' ? (
                                    <>
                                        <button className="btn-concluir" onClick={() => mudarStatus(atendimento, 'concluido')}>Concluir</button>
                                        <button className="btn-secundario" onClick={() => mudarStatus(atendimento, 'faltou')}>Faltou</button>
                                        <button className="btn-excluir" onClick={() => mudarStatus(atendimento, 'cancelado')}>Cancelar</button>
                                    </>
                                ) : (
                                    <button className="btn-secundario" onClick={() => mudarStatus(atendimento, 'agendado')}>Reabrir</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filtrados.length === 0 && (
                        <tr>
                            <td colSpan="9">Nenhum atendimento encontrado com esses filtros.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Paginacao paginacao={paginacao} onTrocarPagina={setPagina} />
        </>
    );
}

export default TabelaAtendimentos;
