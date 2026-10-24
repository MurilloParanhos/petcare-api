import { useState } from 'react';
import { api } from '../api';
import { formatarMoeda, formatarTelefone, normalizar, paginar } from '../utils';
import { chaveDeOrdem, dataISO, faixaDeHorario, horariosLivres, profissionaisLivres } from '../agenda';
import Paginacao from './Paginacao';
import CampoData from './CampoData';
import CampoSelecao from './CampoSelecao';

const FORM_VAZIO = {
    cliente_id: '', animal_id: '', servico_id: '', valor: '',
    data_atendimento: '', hora_atendimento: '', profissional_id: '', observacoes: ''
};

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

function Atendimentos({ atendimentos, inativos, clientes, animais, servicos, profissionais, recarregar }) {
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
            const diferenca = chaveDeOrdem(a).localeCompare(chaveDeOrdem(b));
            // Agendados: o mais proximo primeiro. Realizados e todos: o mais recente primeiro
            return status === 'agendados' ? diferenca : -diferenca;
        });

    function nomeDoProfissional(profissionalId) {
        return profissionais.find((p) => p.id === profissionalId)?.nome ?? '';
    }

    function servicoDoForm(dadosDoForm) {
        return servicos.find((s) => s.id === Number(dadosDoForm.servico_id));
    }

    // Profissionais que realizam o servico escolhido (tosador ou veterinario)
    function profissionaisDoServico(dadosDoForm) {
        const funcao = servicoDoForm(dadosDoForm)?.funcao;
        return profissionais.filter((p) => p.funcao === funcao && (p.ativo || p.id === Number(dadosDoForm.profissional_id)));
    }

    // Horarios em que algum profissional do servico esta livre no dia escolhido
    function livresPara(dadosDoForm, idIgnorado = editandoId) {
        if (!dadosDoForm.data_atendimento || !dadosDoForm.servico_id) return [];
        return horariosLivres({
            data: dadosDoForm.data_atendimento,
            duracao: servicoDoForm(dadosDoForm)?.duracao_minutos ?? 60,
            profissionais: profissionaisDoServico(dadosDoForm),
            atendimentos,
            servicos,
            ignorarId: idIgnorado
        });
    }

    // Profissionais livres no horario escolhido, do que tem menos atendimentos
    // no dia para o que tem mais (assim o trabalho fica dividido)
    function livresNoHorario(dadosDoForm, idIgnorado = editandoId) {
        if (!dadosDoForm.data_atendimento || !dadosDoForm.servico_id || !dadosDoForm.hora_atendimento) return [];
        const cargaNoDia = (p) => atendimentos.filter((a) =>
            a.profissional_id === p.id && a.id !== idIgnorado && dataISO(a.data_atendimento) === dadosDoForm.data_atendimento
        ).length;

        return profissionaisLivres({
            data: dadosDoForm.data_atendimento,
            hora: dadosDoForm.hora_atendimento,
            duracao: servicoDoForm(dadosDoForm)?.duracao_minutos ?? 60,
            profissionais: profissionaisDoServico(dadosDoForm),
            atendimentos,
            servicos,
            ignorarId: idIgnorado
        }).sort((a, b) => cargaNoDia(a) - cargaNoDia(b));
    }

    // Mantem horario e profissional escolhidos se ainda estiverem livres;
    // se nao, sugere o primeiro horario livre e o profissional menos ocupado
    function comAgendaSugerida(dadosDoForm, idIgnorado = editandoId) {
        const horas = livresPara(dadosDoForm, idIgnorado);
        const hora = horas.includes(dadosDoForm.hora_atendimento) ? dadosDoForm.hora_atendimento : (horas[0] ?? '');

        const comHora = { ...dadosDoForm, hora_atendimento: hora };
        const livres = livresNoHorario(comHora, idIgnorado);
        const continuaLivre = livres.some((p) => p.id === Number(dadosDoForm.profissional_id));

        return { ...comHora, profissional_id: continuaLivre ? dadosDoForm.profissional_id : (livres[0]?.id ?? '') };
    }

    const horariosDoFormulario = livresPara(form);
    // Ao editar, o horario atual aparece mesmo se nao estiver na grade de 30 em 30 min
    if (form.hora_atendimento && !horariosDoFormulario.includes(form.hora_atendimento)) {
        horariosDoFormulario.unshift(form.hora_atendimento);
    }

    const profissionaisDoFormulario = livresNoHorario(form);
    // Ao editar, o profissional atual aparece mesmo se a agenda dele mudou
    const profissionalAtual = profissionais.find((p) => p.id === Number(form.profissional_id));
    if (profissionalAtual && !profissionaisDoFormulario.some((p) => p.id === profissionalAtual.id)) {
        profissionaisDoFormulario.unshift(profissionalAtual);
    }

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

    // Para os campos de selecao, que entregam o valor direto (sem evento)
    function definirCampo(nome, valor) {
        setForm({ ...form, [nome]: valor });
    }

    // Trocar o cliente limpa o animal, porque o animal anterior era de outro dono
    function escolherCliente(clienteId) {
        setForm({ ...form, cliente_id: clienteId, animal_id: animalPadrao(clienteId) });
    }

    // Escolher o servico preenche o valor com o preco do catalogo (pode ser alterado)
    function escolherServico(servicoId) {
        const preco = servicos.find((s) => s.id === Number(servicoId))?.preco ?? '';
        setForm(comAgendaSugerida({ ...form, servico_id: servicoId, valor: preco }));
    }

    // Escolher a data ja sugere o primeiro horario livre do dia e um profissional
    function escolherData(data) {
        setForm(comAgendaSugerida({ ...form, data_atendimento: data }));
    }

    // Trocar o horario mantem o profissional se ele estiver livre; se nao, troca por outro
    function escolherHora(hora) {
        setForm(comAgendaSugerida({ ...form, hora_atendimento: hora }));
    }

    function editar(atendimento) {
        setForm({
            cliente_id: atendimento.cliente_id,
            animal_id: atendimento.animal_id ?? animalPadrao(atendimento.cliente_id),
            servico_id: atendimento.servico_id ?? '',
            valor: atendimento.valor ?? '',
            data_atendimento: dataISO(atendimento.data_atendimento),
            hora_atendimento: atendimento.hora_atendimento?.slice(0, 5) ?? '',
            profissional_id: atendimento.profissional_id ?? '',
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

        const { cliente_id, animal_id, servico_id, valor, data_atendimento, hora_atendimento, profissional_id } = form;
        const observacoes = form.observacoes.trim();

        if (!cliente_id || !servico_id || !data_atendimento) {
            setMsg('Preencha cliente, serviço e data.');
            return;
        }

        if (!hora_atendimento || !profissional_id) {
            setMsg('Não há horário livre para esse serviço nesse dia. Escolha outra data.');
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
            await api(url, {
                method,
                body: { cliente_id, animal_id, servico_id, profissional_id, valor, data_atendimento, hora_atendimento, observacoes }
            });
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
                            <CampoSelecao
                                id="atendimentoCliente"
                                valor={form.cliente_id}
                                opcoes={clientes.map((c) => ({ valor: c.id, rotulo: c.nome }))}
                                onChange={escolherCliente}
                                placeholder="Digite ou escolha..."
                            />
                        </div>
                        <div>
                            <label htmlFor="atendimentoAnimal">Pet</label>
                            <CampoSelecao
                                id="atendimentoAnimal"
                                valor={form.animal_id}
                                opcoes={animaisDoCliente(form.cliente_id).map((a) => ({ valor: a.id, rotulo: a.nome }))}
                                onChange={(valor) => definirCampo('animal_id', valor)}
                                desabilitado={animaisDoCliente(form.cliente_id).length === 0}
                                buscavel={false}
                                placeholder={!form.cliente_id
                                    ? 'Escolha o cliente'
                                    : animaisDoCliente(form.cliente_id).length === 0 ? 'Cliente sem pets' : 'Selecione...'}
                            />
                        </div>
                        <div>
                            <label htmlFor="atendimentoServico">Serviço</label>
                            <CampoSelecao
                                id="atendimentoServico"
                                valor={form.servico_id}
                                opcoes={servicosDoFormulario.map((s) => ({ valor: s.id, rotulo: s.nome }))}
                                onChange={escolherServico}
                                buscavel={false}
                            />
                        </div>
                        <div>
                            <label htmlFor="atendimentoValor">Valor (R$)</label>
                            <input type="number" id="atendimentoValor" name="valor" min="0" step="0.01" value={form.valor} onChange={alterarCampo} />
                        </div>
                        <div>
                            <label htmlFor="atendimentoData">Data</label>
                            <CampoData id="atendimentoData" valor={form.data_atendimento} onChange={escolherData} />
                        </div>
                        <div>
                            <label htmlFor="atendimentoHora">Horário</label>
                            <CampoSelecao
                                id="atendimentoHora"
                                valor={form.hora_atendimento}
                                opcoes={horariosDoFormulario.map((hora) => ({ valor: hora, rotulo: hora }))}
                                onChange={escolherHora}
                                desabilitado={horariosDoFormulario.length === 0}
                                buscavel={false}
                                placeholder={!form.data_atendimento || !form.servico_id ? 'Escolha serviço e data' : 'Dia lotado'}
                            />
                        </div>
                        <div>
                            <label htmlFor="atendimentoProfissional">Profissional</label>
                            <CampoSelecao
                                id="atendimentoProfissional"
                                valor={form.profissional_id}
                                opcoes={profissionaisDoFormulario.map((p) => ({ valor: p.id, rotulo: p.nome }))}
                                onChange={(valor) => definirCampo('profissional_id', valor)}
                                desabilitado={profissionaisDoFormulario.length === 0}
                                buscavel={false}
                                placeholder="-"
                            />
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
                                <th>Espécie</th>
                                <th>Serviço</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th>Horário</th>
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
                                    <td className="sem-quebra">
                                        {faixaDeHorario(atendimento, servicos)}
                                        <span className="detalhe-celula">{nomeDoProfissional(atendimento.profissional_id)}</span>
                                    </td>
                                    <td>{atendimento.observacoes ?? '-'}</td>
                                    <td>
                                        <button className="btn-editar" onClick={() => editar(atendimento)}>Editar</button>
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
