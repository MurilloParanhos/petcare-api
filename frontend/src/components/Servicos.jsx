import { useState } from 'react';
import { api } from '../api';
import { formatarMoeda } from '../utils';
import { NOMES_DAS_FUNCOES } from '../agenda';

const FORM_VAZIO = { nome: '', preco: '', duracao_minutos: '60', funcao: 'tosador' };

function Servicos({ servicos, profissionais, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editando, setEditando] = useState(null);
    const [msg, setMsg] = useState('');

    function alterarCampo(evento) {
        setForm({ ...form, [evento.target.name]: evento.target.value });
    }

    function editar(servico) {
        setForm({
            nome: servico.nome,
            preco: servico.preco,
            duracao_minutos: servico.duracao_minutos,
            funcao: servico.funcao
        });
        setEditando(servico);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelar() {
        setForm(FORM_VAZIO);
        setEditando(null);
        setMsg('');
    }

    async function salvar(evento) {
        evento.preventDefault();
        setMsg('');

        const nome = form.nome.trim();
        const { preco, duracao_minutos, funcao } = form;

        if (!nome || preco === '' || !duracao_minutos) {
            setMsg('Preencha o nome, o preço e a duração.');
            return;
        }

        try {
            if (editando) {
                await api(`/api/servicos/${editando.id}`, {
                    method: 'PUT',
                    body: { nome, preco, duracao_minutos, funcao, ativo: editando.ativo }
                });
            } else {
                await api('/api/servicos', { method: 'POST', body: { nome, preco, duracao_minutos, funcao } });
            }
            cancelar();
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    // Servico nao e excluido, porque atendimentos antigos apontam para ele.
    // Desativado, ele some do formulario de atendimento mas fica no historico.
    async function alternarAtivo(servico) {
        try {
            await api(`/api/servicos/${servico.id}`, {
                method: 'PUT',
                body: {
                    nome: servico.nome,
                    preco: servico.preco,
                    duracao_minutos: servico.duracao_minutos,
                    funcao: servico.funcao,
                    ativo: !servico.ativo
                }
            });
            recarregar();
        } catch (erro) {
            alert(erro.message);
        }
    }

    return (
        <div>
            <h2>Serviços</h2>
            <p className="subtitulo-aba">Preços usados como padrão ao registrar um atendimento.</p>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="servicoNome">Nome</label>
                    <input type="text" id="servicoNome" name="nome" value={form.nome} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="servicoPreco">Preço (R$)</label>
                    <input type="number" id="servicoPreco" name="preco" min="0" step="0.01" value={form.preco} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="servicoDuracao">Duração (min)</label>
                    <input type="number" id="servicoDuracao" name="duracao_minutos" min="15" step="15" value={form.duracao_minutos} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="servicoFuncao">Realizado por</label>
                    <select id="servicoFuncao" name="funcao" value={form.funcao} onChange={alterarCampo}>
                        {Object.entries(NOMES_DAS_FUNCOES).map(([funcao, nome]) => (
                            <option key={funcao} value={funcao}>{nome}</option>
                        ))}
                    </select>
                </div>
                <button type="submit">{editando ? 'Salvar edição' : 'Adicionar serviço'}</button>
                {editando && <button type="button" onClick={cancelar}>Cancelar</button>}
                <p className="erro">{msg}</p>
            </form>

            <table>
                <thead>
                    <tr>
                        <th>Serviço</th>
                        <th>Preço</th>
                        <th>Duração</th>
                        <th>Realizado por</th>
                        <th>Situação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {servicos.map((servico) => (
                        <tr key={servico.id} className={servico.ativo ? '' : 'linha-inativa'}>
                            <td>{servico.nome}</td>
                            <td>{formatarMoeda(servico.preco)}</td>
                            <td>{servico.duracao_minutos} min</td>
                            <td>{NOMES_DAS_FUNCOES[servico.funcao]}</td>
                            <td>{servico.ativo ? 'Ativo' : 'Desativado'}</td>
                            <td>
                                <button className="btn-editar" onClick={() => editar(servico)}>Editar</button>
                                <button
                                    className={servico.ativo ? 'btn-excluir' : 'btn-editar'}
                                    onClick={() => alternarAtivo(servico)}
                                >
                                    {servico.ativo ? 'Desativar' : 'Ativar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {servicos.length === 0 && (
                        <tr>
                            <td colSpan="6">Nenhum serviço cadastrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <h2>Equipe</h2>
            <p className="subtitulo-aba">Cada profissional tem a sua agenda; dois atendimentos no mesmo horário vão para profissionais diferentes.</p>
            <section className="equipe">
                {Object.entries(NOMES_DAS_FUNCOES).map(([funcao, nome]) => (
                    <div key={funcao} className="painel">
                        <h3>{nome}</h3>
                        <ul>
                            {profissionais.filter((p) => p.funcao === funcao).map((p) => (
                                <li key={p.id}>
                                    <i className={`fa-solid ${funcao === 'veterinario' ? 'fa-user-doctor' : 'fa-scissors'}`}></i>
                                    {p.nome}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
        </div>
    );
}

export default Servicos;
