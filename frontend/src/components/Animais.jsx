import { useState } from 'react';
import { api } from '../api';

const FORM_VAZIO = { nome: '', especie: '', raca: '', idade: '', cliente_id: '' };

function Animais({ animais, clientes, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');

    function alterarCampo(evento) {
        setForm({ ...form, [evento.target.name]: evento.target.value });
    }

    function editar(animal) {
        setForm({
            nome: animal.nome,
            especie: animal.especie,
            raca: animal.raca ?? '',
            idade: animal.idade ?? '',
            cliente_id: animal.cliente_id
        });
        setEditandoId(animal.id);
    }

    function cancelar() {
        setForm(FORM_VAZIO);
        setEditandoId(null);
        setMsg('');
    }

    async function excluir(id) {
        if (!confirm('Tem certeza que quer excluir esse animal?')) return;

        try {
            await api(`/api/animais/${id}`, { method: 'DELETE' });
            recarregar();
        } catch (erro) {
            alert(erro.message);
        }
    }

    async function salvar(evento) {
        evento.preventDefault();
        setMsg('');

        const nome = form.nome.trim();
        const especie = form.especie.trim();
        const raca = form.raca.trim();
        const { idade, cliente_id } = form;

        if (!nome || !especie) {
            setMsg('Preencha pelo menos nome e espécie.');
            return;
        }

        if (!cliente_id) {
            setMsg('Escolha o dono do animal.');
            return;
        }

        const url = editandoId ? `/api/animais/${editandoId}` : '/api/animais';
        const method = editandoId ? 'PUT' : 'POST';

        try {
            await api(url, { method, body: { nome, especie, raca, idade, cliente_id } });
            cancelar();
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    return (
        <div>
            <h2>Animais</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Espécie</th>
                        <th>Raça</th>
                        <th>Idade</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {animais.map((animal) => (
                        <tr key={animal.id}>
                            <td>{animal.nome}</td>
                            <td>{animal.especie}</td>
                            <td>{animal.raca ?? '-'}</td>
                            <td>{animal.idade ?? '-'}</td>
                            <td>
                                <button className="btn-editar" onClick={() => editar(animal)}>Editar</button>
                                <button className="btn-excluir" onClick={() => excluir(animal.id)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="animalNome">Nome</label>
                    <input type="text" id="animalNome" name="nome" value={form.nome} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="animalEspecie">Espécie</label>
                    <input type="text" id="animalEspecie" name="especie" value={form.especie} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="animalRaca">Raça</label>
                    <input type="text" id="animalRaca" name="raca" value={form.raca} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="animalIdade">Idade</label>
                    <input type="number" id="animalIdade" name="idade" value={form.idade} onChange={alterarCampo} />
                </div>
                <div>
                    <label htmlFor="animalCliente">Dono</label>
                    <select id="animalCliente" name="cliente_id" value={form.cliente_id} onChange={alterarCampo}>
                        <option value="">Selecione...</option>
                        {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                        ))}
                    </select>
                </div>
                <button type="submit">{editandoId ? 'Salvar edição' : 'Adicionar animal'}</button>
                {editandoId && <button type="button" onClick={cancelar}>Cancelar</button>}
                <p className="erro">{msg}</p>
            </form>
        </div>
    );
}

export default Animais;
