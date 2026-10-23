import { useState } from 'react';
import { api } from '../api';

const FORM_VAZIO = { nome: '', telefone: '', email: '' };

function Clientes({ clientes, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');

    // Um onChange so para todos os campos, usando o "name" do input
    function alterarCampo(evento) {
        setForm({ ...form, [evento.target.name]: evento.target.value });
    }

    function editar(cliente) {
        setForm({
            nome: cliente.nome,
            telefone: cliente.telefone ?? '',
            email: cliente.email ?? ''
        });
        setEditandoId(cliente.id);
    }

    function cancelar() {
        setForm(FORM_VAZIO);
        setEditandoId(null);
        setMsg('');
    }

    async function excluir(id) {
        if (!confirm('Tem certeza que quer excluir esse cliente?')) return;

        try {
            await api(`/api/clientes/${id}`, { method: 'DELETE' });
            recarregar();
        } catch (erro) {
            alert(erro.message);
        }
    }

    async function salvar(evento) {
        evento.preventDefault();
        setMsg('');

        const nome = form.nome.trim();
        const telefone = form.telefone.trim();
        const email = form.email.trim();

        if (!nome) {
            setMsg('Preencha o nome do cliente.');
            return;
        }

        const url = editandoId ? `/api/clientes/${editandoId}` : '/api/clientes';
        const method = editandoId ? 'PUT' : 'POST';

        try {
            await api(url, { method, body: { nome, telefone, email } });
            cancelar();
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    return (
        <div>
            <h2>Clientes</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                            <td>{cliente.nome}</td>
                            <td>{cliente.telefone}</td>
                            <td>{cliente.email}</td>
                            <td>
                                <button className="btn-editar" onClick={() => editar(cliente)}>Editar</button>
                                <button className="btn-excluir" onClick={() => excluir(cliente.id)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="clienteNome">Nome</label>
                    <input type="text" id="clienteNome" name="nome" value={form.nome} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="clienteTelefone">Telefone</label>
                    <input type="text" id="clienteTelefone" name="telefone" value={form.telefone} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="clienteEmail">Email</label>
                    <input type="email" id="clienteEmail" name="email" value={form.email} onChange={alterarCampo} />
                </div>
                <button type="submit">{editandoId ? 'Salvar edição' : 'Adicionar cliente'}</button>
                {editandoId && <button type="button" onClick={cancelar}>Cancelar</button>}
                <p className="erro">{msg}</p>
            </form>
        </div>
    );
}

export default Clientes;
