import { useState } from 'react';
import { api } from '../api';
import { formatarMoeda } from '../utils';

const FORM_VAZIO = { nome: '', preco: '' };

function Servicos({ servicos, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editando, setEditando] = useState(null);
    const [msg, setMsg] = useState('');

    function alterarCampo(evento) {
        setForm({ ...form, [evento.target.name]: evento.target.value });
    }

    function editar(servico) {
        setForm({ nome: servico.nome, preco: servico.preco });
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
        const preco = form.preco;

        if (!nome || preco === '') {
            setMsg('Preencha o nome e o preço.');
            return;
        }

        try {
            if (editando) {
                await api(`/api/servicos/${editando.id}`, { method: 'PUT', body: { nome, preco, ativo: editando.ativo } });
            } else {
                await api('/api/servicos', { method: 'POST', body: { nome, preco } });
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
                body: { nome: servico.nome, preco: servico.preco, ativo: !servico.ativo }
            });
            recarregar();
        } catch (erro) {
            alert(erro.message);
        }
    }

    return (
        <div>
            <h2>Serviços</h2>
            <p className="subtitulo-inativos">Preços usados como padrão ao registrar um atendimento.</p>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="servicoNome">Nome</label>
                    <input type="text" id="servicoNome" name="nome" value={form.nome} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="servicoPreco">Preço (R$)</label>
                    <input type="number" id="servicoPreco" name="preco" min="0" step="0.01" value={form.preco} onChange={alterarCampo} />
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
                        <th>Situação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {servicos.map((servico) => (
                        <tr key={servico.id} className={servico.ativo ? '' : 'linha-inativa'}>
                            <td>{servico.nome}</td>
                            <td>{formatarMoeda(servico.preco)}</td>
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
                            <td colSpan="4">Nenhum serviço cadastrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Servicos;
