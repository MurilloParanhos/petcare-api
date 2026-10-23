import { useState } from 'react';
import { api } from '../api';
import { formatarTelefone, mascaraTelefone, normalizar, paginar, somenteNumeros } from '../utils';
import Paginacao from './Paginacao';

const FORM_VAZIO = { nome: '', telefone: '', email: '' };

function Clientes({ clientes, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');
    const [busca, setBusca] = useState('');
    const [pagina, setPagina] = useState(1);

    // Busca no nome, telefone e email ao mesmo tempo, em ordem alfabetica.
    // O telefone e comparado so pelos numeros, entao "(12) 9888" tambem acha.
    const numerosDaBusca = somenteNumeros(busca);
    const filtrados = clientes
        .filter((c) =>
            [c.nome, c.email].some((campo) => normalizar(campo).includes(normalizar(busca))) ||
            (numerosDaBusca && somenteNumeros(c.telefone).includes(numerosDaBusca))
        )
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const paginacao = paginar(filtrados, pagina);

    function buscar(texto) {
        setBusca(texto);
        setPagina(1);
    }

    // Um onChange so para todos os campos, usando o "name" do input
    function alterarCampo(evento) {
        const { name, value } = evento.target;
        setForm({ ...form, [name]: name === 'telefone' ? mascaraTelefone(value) : value });
    }

    function editar(cliente) {
        setForm({
            nome: cliente.nome,
            telefone: mascaraTelefone(cliente.telefone),
            email: cliente.email ?? ''
        });
        setEditandoId(cliente.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        const telefone = somenteNumeros(form.telefone);
        const email = form.email.trim();

        if (!nome) {
            setMsg('Preencha o nome do cliente.');
            return;
        }

        if (telefone && telefone.length < 10) {
            setMsg('Telefone incompleto: informe o DDD e o número.');
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

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="clienteNome">Nome</label>
                    <input type="text" id="clienteNome" name="nome" value={form.nome} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="clienteTelefone">Telefone</label>
                    <input type="tel" id="clienteTelefone" name="telefone" placeholder="(DD) 00000-0000" value={form.telefone} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="clienteEmail">Email</label>
                    <input type="email" id="clienteEmail" name="email" value={form.email} onChange={alterarCampo} />
                </div>
                <button type="submit">{editandoId ? 'Salvar edição' : 'Adicionar cliente'}</button>
                {editandoId && <button type="button" onClick={cancelar}>Cancelar</button>}
                <p className="erro">{msg}</p>
            </form>

            <div className="filtros">
                <input
                    type="search"
                    placeholder="Buscar por nome, telefone ou email..."
                    value={busca}
                    onChange={(e) => buscar(e.target.value)}
                />
            </div>

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
                    {paginacao.itens.map((cliente) => (
                        <tr key={cliente.id}>
                            <td>{cliente.nome}</td>
                            <td>{formatarTelefone(cliente.telefone)}</td>
                            <td>{cliente.email}</td>
                            <td>
                                <button className="btn-editar" onClick={() => editar(cliente)}>Editar</button>
                                <button className="btn-excluir" onClick={() => excluir(cliente.id)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                    {filtrados.length === 0 && (
                        <tr>
                            <td colSpan="4">Nenhum cliente encontrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Paginacao paginacao={paginacao} onTrocarPagina={setPagina} />
        </div>
    );
}

export default Clientes;
