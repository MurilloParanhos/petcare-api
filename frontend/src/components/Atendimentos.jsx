import { useState } from 'react';
import { api } from '../api';
import { formatarMoeda, formatarTelefone, normalizar, paginar } from '../utils';
import Paginacao from './Paginacao';

const FORM_VAZIO = { cliente_id: '', animal_id: '', servico_id: '', valor: '', data_atendimento: '', observacoes: '' };

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

function Atendimentos({ atendimentos, inativos, clientes, animais, servicos, recarregar }) {
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

    function nomeDoAnimal(animalId) {
        return animais.find((a) => a.id === animalId)?.nome ?? '-';
    }

    // Icone de cachorro ou gato ao lado da especie; outras especies so com o texto
    function especieDoAnimal(animalId) {
        const especie = animais.find((a) => a.id === animalId)?.especie;
        if (!especie) return '-';

        const icones = { cachorro: 'fa-dog', gato: 'fa-cat' };
        const icone = icones[normalizar(especie)];

        return (
            <span className="especie">
                {icone && <i className={`fa-solid ${icone}`}></i>}
                {especie}
            </span>
        );
    }

    function animaisDoCliente(clienteId) {
        return animais.filter((a) => a.cliente_id === Number(clienteId));
    }

    // Se o cliente tem um animal so, ele ja vem escolhido
    function animalPadrao(clienteId) {
        const doCliente = animaisDoCliente(clienteId);
        return doCliente.length === 1 ? doCliente[0].id : '';
    }

    function jaAconteceu(atendimento) {
        return new Date(atendimento.data_atendimento) < inicioDeHoje();
    }

    // No formulario aparecem so os servicos ativos, mais o servico do
    // atendimento em edicao (caso ele tenha sido desativado depois)
    const servicosDoFormulario = servicos.filter((s) => s.ativo || s.id === Number(form.servico_id));

    const filtrados = atendimentos
        .filter((a) => status === 'todos' || (status === 'realizados') === jaAconteceu(a))
        .filter((a) => [nomeDoCliente(a.cliente_id), nomeDoAnimal(a.animal_id)].some((campo) => normalizar(campo).includes(normalizar(busca))))
        .filter((a) => !servico || a.servico_id === Number(servico))
        .sort((a, b) => {
            const diferenca = new Date(a.data_atendimento) - new Date(b.data_atendimento);
            // Agendados: o mais proximo primeiro. Realizados e todos: o mais recente primeiro
            return status === 'agendados' ? diferenca : -diferenca;
        });

    const paginacao = paginar(filtrados, pagina);

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

    // Trocar o cliente limpa o animal, porque o animal anterior era de outro dono
    function escolherCliente(evento) {
        const clienteId = evento.target.value;
        setForm({ ...form, cliente_id: clienteId, animal_id: animalPadrao(clienteId) });
    }

    // Escolher o servico preenche o valor com o preco do catalogo (pode ser alterado)
    function escolherServico(evento) {
        const servicoId = evento.target.value;
        const preco = servicos.find((s) => s.id === Number(servicoId))?.preco ?? '';
        setForm({ ...form, servico_id: servicoId, valor: preco });
    }

    function editar(atendimento) {
        setForm({
            cliente_id: atendimento.cliente_id,
            animal_id: atendimento.animal_id ?? animalPadrao(atendimento.cliente_id),
            servico_id: atendimento.servico_id ?? '',
            valor: atendimento.valor ?? '',
            data_atendimento: new Date(atendimento.data_atendimento).toISOString().split('T')[0],
            observacoes: atendimento.observacoes ?? ''
        });
        setEditandoId(atendimento.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Botao "Agendar" da lista de inativos: abre o formulario com o cliente escolhido
    function agendar(clienteId) {
        setForm({ ...FORM_VAZIO, cliente_id: clienteId, animal_id: animalPadrao(clienteId) });
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

        const { cliente_id, animal_id, servico_id, valor, data_atendimento } = form;
        const observacoes = form.observacoes.trim();

        if (!cliente_id || !servico_id || !data_atendimento) {
            setMsg('Preencha cliente, serviço e data.');
            return;
        }

        if (valor === '' || Number(valor) < 0) {
            setMsg('Informe um valor válido.');
            return;
        }

        if (!animal_id && animaisDoCliente(cliente_id).length > 0) {
            setMsg('Escolha qual animal foi atendido.');
            return;
        }

        const url = editandoId ? `/api/atendimentos/${editandoId}` : '/api/atendimentos';
        const method = editandoId ? 'PUT' : 'POST';

        try {
            await api(url, { method, body: { cliente_id, animal_id, servico_id, valor, data_atendimento, observacoes } });
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
                            <select id="atendimentoCliente" name="cliente_id" value={form.cliente_id} onChange={escolherCliente}>
                                <option value="">Selecione...</option>
                                {clientes.map((cliente) => (
                                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="atendimentoAnimal">Pet</label>
                            <select
                                id="atendimentoAnimal"
                                name="animal_id"
                                value={form.animal_id}
                                onChange={alterarCampo}
                                disabled={animaisDoCliente(form.cliente_id).length === 0}
                            >
                                <option value="">
                                    {!form.cliente_id
                                        ? 'Escolha o cliente'
                                        : animaisDoCliente(form.cliente_id).length === 0
                                            ? 'Cliente sem pets'
                                            : 'Selecione...'}
                                </option>
                                {animaisDoCliente(form.cliente_id).map((animal) => (
                                    <option key={animal.id} value={animal.id}>{animal.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="atendimentoServico">Serviço</label>
                            <select id="atendimentoServico" name="servico_id" value={form.servico_id} onChange={escolherServico}>
                                <option value="">Selecione...</option>
                                {servicosDoFormulario.map((s) => (
                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="atendimentoValor">Valor (R$)</label>
                            <input type="number" id="atendimentoValor" name="valor" min="0" step="0.01" value={form.valor} onChange={alterarCampo} />
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
                            placeholder="Buscar por cliente ou pet..."
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
                            {servicos.map((s) => (
                                <option key={s.id} value={s.id}>{s.nome}</option>
                            ))}
                        </select>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Pet</th>
                                <th>Espécie</th>
                                <th>Serviço</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th>Observações</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginacao.itens.map((atendimento) => (
                                <tr
                                    key={atendimento.id}
                                    className={jaAconteceu(atendimento) ? 'atendimento-realizado' : 'atendimento-agendado'}
                                >
                                    <td>{nomeDoCliente(atendimento.cliente_id)}</td>
                                    <td>{nomeDoAnimal(atendimento.animal_id)}</td>
                                    <td>{especieDoAnimal(atendimento.animal_id)}</td>
                                    <td>{atendimento.tipo_servico}</td>
                                    <td>{formatarMoeda(atendimento.valor)}</td>
                                    <td>{new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR')}</td>
                                    <td>{atendimento.observacoes ?? '-'}</td>
                                    <td>
                                        <button className="btn-editar" onClick={() => editar(atendimento)}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan="8">Nenhum atendimento encontrado com esses filtros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <Paginacao paginacao={paginacao} onTrocarPagina={setPagina} />
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
                                    <td>{formatarTelefone(cliente.telefone) || '-'}</td>
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
