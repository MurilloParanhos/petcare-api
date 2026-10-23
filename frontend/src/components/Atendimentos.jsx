import { useState } from 'react';
import { api } from '../api';

const FORM_VAZIO = { cliente_id: '', tipo_servico: '', data_atendimento: '', observacoes: '' };
const POR_PAGINA = 10;

const STATUS = [
    { id: 'agendados', nome: 'Agendados' },
    { id: 'realizados', nome: 'Realizados' },
    { id: 'todos', nome: 'Todos' }
];

function inicioDeHoje() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
}

// Deixa o texto sem acento e minusculo, para a busca achar "Patricia" digitando "patrícia"
function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function Atendimentos({ atendimentos, inativos, clientes, recarregar }) {
    const [subAba, setSubAba] = useState('atendimentos');
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');

    const [busca, setBusca] = useState('');
    const [status, setStatus] = useState('agendados');
    const [servico, setServico] = useState('');
    const [pagina, setPagina] = useState(1);

    function nomeDoCliente(clienteId) {
        return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
    }

    function jaAconteceu(atendimento) {
        return new Date(atendimento.data_atendimento) < inicioDeHoje();
    }

    // Lista de servicos para o filtro, sem repetir "Banho" e "banho "
    const servicos = [...new Map(
        atendimentos.map((a) => [normalizar(a.tipo_servico), a.tipo_servico.trim()])
    ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

    const filtrados = atendimentos
        .filter((a) => status === 'todos' || (status === 'realizados') === jaAconteceu(a))
        .filter((a) => normalizar(nomeDoCliente(a.cliente_id)).includes(normalizar(busca)))
        .filter((a) => !servico || normalizar(a.tipo_servico) === servico)
        .sort((a, b) => {
            const diferenca = new Date(a.data_atendimento) - new Date(b.data_atendimento);
            // Agendados: o mais proximo primeiro. Realizados e todos: o mais recente primeiro
            return status === 'agendados' ? diferenca : -diferenca;
        });

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const daPagina = filtrados.slice(inicio, inicio + POR_PAGINA);

    // Qualquer filtro novo volta para a primeira pagina
    function filtrar(setFiltro) {
        return (valor) => {
            setFiltro(valor);
            setPagina(1);
        };
    }

    function alterarCampo(evento) {
        setForm({ ...form, [evento.target.name]: evento.target.value });
    }

    function editar(atendimento) {
        setForm({
            cliente_id: atendimento.cliente_id,
            tipo_servico: atendimento.tipo_servico,
            data_atendimento: new Date(atendimento.data_atendimento).toISOString().split('T')[0],
            observacoes: atendimento.observacoes ?? ''
        });
        setEditandoId(atendimento.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Botao "Agendar" da lista de inativos: abre o formulario com o cliente escolhido
    function agendar(clienteId) {
        setForm({ ...FORM_VAZIO, cliente_id: clienteId });
        setEditandoId(null);
        setSubAba('atendimentos');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelar() {
        setForm(FORM_VAZIO);
        setEditandoId(null);
        setMsg('');
    }

    async function salvar(evento) {
        evento.preventDefault();
        setMsg('');

        const { cliente_id, data_atendimento } = form;
        const tipo_servico = form.tipo_servico.trim();
        const observacoes = form.observacoes.trim();

        if (!cliente_id || !tipo_servico || !data_atendimento) {
            setMsg('Preencha cliente, serviço e data.');
            return;
        }

        const url = editandoId ? `/api/atendimentos/${editandoId}` : '/api/atendimentos';
        const method = editandoId ? 'PUT' : 'POST';

        try {
            await api(url, { method, body: { cliente_id, tipo_servico, data_atendimento, observacoes } });
            cancelar();
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    return (
        <div>
            <h2>Atendimentos</h2>

            <div className="sub-abas">
                <button
                    className={subAba === 'atendimentos' ? 'ativo' : ''}
                    onClick={() => setSubAba('atendimentos')}
                >
                    Atendimentos
                </button>
                <button
                    className={subAba === 'inativos' ? 'ativo' : ''}
                    onClick={() => setSubAba('inativos')}
                >
                    Clientes inativos
                    {inativos.length > 0 && <span className="contador">{inativos.length}</span>}
                </button>
            </div>

            {subAba === 'atendimentos' && (
                <>
                    <form className="formulario" onSubmit={salvar}>
                        <div>
                            <label htmlFor="atendimentoCliente">Cliente</label>
                            <select id="atendimentoCliente" name="cliente_id" value={form.cliente_id} onChange={alterarCampo}>
                                <option value="">Selecione...</option>
                                {clientes.map((cliente) => (
                                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="atendimentoServico">Serviço</label>
                            <input type="text" id="atendimentoServico" name="tipo_servico" placeholder="Ex: Banho e Tosa" value={form.tipo_servico} onChange={alterarCampo} />
                        </div>
                        <div>
                            <label htmlFor="atendimentoData">Data</label>
                            <input type="date" id="atendimentoData" name="data_atendimento" value={form.data_atendimento} onChange={alterarCampo} />
                        </div>
                        <div>
                            <label htmlFor="atendimentoObs">Observações</label>
                            <input type="text" id="atendimentoObs" name="observacoes" value={form.observacoes} onChange={alterarCampo} />
                        </div>
                        <button type="submit">{editandoId ? 'Salvar edição' : 'Registrar atendimento'}</button>
                        {editandoId && <button type="button" onClick={cancelar}>Cancelar</button>}
                        <p className="erro">{msg}</p>
                    </form>

                    <div className="filtros">
                        <input
                            type="search"
                            placeholder="Buscar por cliente..."
                            value={busca}
                            onChange={(e) => filtrar(setBusca)(e.target.value)}
                        />
                        <div className="grupo-botoes">
                            {STATUS.map((s) => (
                                <button
                                    key={s.id}
                                    className={status === s.id ? 'ativo' : ''}
                                    onClick={() => filtrar(setStatus)(s.id)}
                                >
                                    {s.nome}
                                </button>
                            ))}
                        </div>
                        <select value={servico} onChange={(e) => filtrar(setServico)(e.target.value)}>
                            <option value="">Todos os serviços</option>
                            {servicos.map(([chave, nome]) => (
                                <option key={chave} value={chave}>{nome}</option>
                            ))}
                        </select>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Serviço</th>
                                <th>Data</th>
                                <th>Observações</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {daPagina.map((atendimento) => (
                                <tr
                                    key={atendimento.id}
                                    className={jaAconteceu(atendimento) ? 'atendimento-realizado' : 'atendimento-agendado'}
                                >
                                    <td>{nomeDoCliente(atendimento.cliente_id)}</td>
                                    <td>{atendimento.tipo_servico}</td>
                                    <td>{new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR')}</td>
                                    <td>{atendimento.observacoes ?? '-'}</td>
                                    <td>
                                        <button className="btn-editar" onClick={() => editar(atendimento)}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan="5">Nenhum atendimento encontrado com esses filtros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {filtrados.length > 0 && (
                        <div className="paginacao">
                            <span>
                                Mostrando {inicio + 1}–{inicio + daPagina.length} de {filtrados.length}
                            </span>
                            <div>
                                <button disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>
                                    Anterior
                                </button>
                                <span>Página {paginaAtual} de {totalPaginas}</span>
                                <button disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {subAba === 'inativos' && (
                <>
                    <p className="subtitulo-inativos">Sem atendimento há mais de 60 dias.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Telefone</th>
                                <th>Último Atendimento</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inativos.map((cliente) => (
                                <tr key={cliente.id}>
                                    <td>{cliente.nome}</td>
                                    <td>{cliente.telefone ?? '-'}</td>
                                    <td>
                                        {cliente.ultimo_atendimento
                                            ? new Date(cliente.ultimo_atendimento).toLocaleDateString('pt-BR')
                                            : 'Nunca atendido'}
                                    </td>
                                    <td>
                                        <button className="btn-editar" onClick={() => agendar(cliente.id)}>Agendar</button>
                                    </td>
                                </tr>
                            ))}
                            {inativos.length === 0 && (
                                <tr>
                                    <td colSpan="4">Nenhum cliente inativo. 🎉</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}

export default Atendimentos;
