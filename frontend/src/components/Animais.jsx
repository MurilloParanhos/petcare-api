import { useState } from 'react';
import { api } from '../api';
import { normalizar, paginar } from '../utils';
import Paginacao from './Paginacao';

const FORM_VAZIO = { nome: '', especie: '', raca: '', idade: '', cliente_id: '' };

function Animais({ animais, clientes, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');
    const [busca, setBusca] = useState('');
    const [especie, setEspecie] = useState('');
    const [pagina, setPagina] = useState(1);

    function nomeDoDono(clienteId) {
        return clientes.find((c) => c.id === clienteId)?.nome ?? '-';
    }

    // Especies para o filtro, sem repetir "Gato" e "gato"
    const especies = [...new Map(
        animais.map((a) => [normalizar(a.especie), a.especie.trim()])
    ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

    // Busca no nome do animal, na raca e no nome do dono, em ordem alfabetica
    const filtrados = animais
        .filter((a) => [a.nome, a.raca, nomeDoDono(a.cliente_id)].some((campo) => normalizar(campo).includes(normalizar(busca))))
        .filter((a) => !especie || normalizar(a.especie) === especie)
        .sort((a, b) => a.nome.localeCompare(b.nome));

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

    function editar(animal) {
        setForm({
            nome: animal.nome,
            especie: animal.especie,
            raca: animal.raca ?? '',
            idade: animal.idade ?? '',
            cliente_id: animal.cliente_id
        });
        setEditandoId(animal.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

            <div className="filtros">
                <input
                    type="search"
                    placeholder="Buscar por nome, raça ou dono..."
                    value={busca}
                    onChange={(e) => filtrar(setBusca)(e.target.value)}
                />
                <select value={especie} onChange={(e) => filtrar(setEspecie)(e.target.value)}>
                    <option value="">Todas as espécies</option>
                    {especies.map(([chave, nome]) => (
                        <option key={chave} value={chave}>{nome}</option>
                    ))}
                </select>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Espécie</th>
                        <th>Raça</th>
                        <th>Idade</th>
                        <th>Dono</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {paginacao.itens.map((animal) => (
                        <tr key={animal.id}>
                            <td>{animal.nome}</td>
                            <td>{animal.especie}</td>
                            <td>{animal.raca ?? '-'}</td>
                            <td>{animal.idade ?? '-'}</td>
                            <td>{nomeDoDono(animal.cliente_id)}</td>
                            <td>
                                <button className="btn-editar" onClick={() => editar(animal)}>Editar</button>
                                <button className="btn-excluir" onClick={() => excluir(animal.id)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                    {filtrados.length === 0 && (
                        <tr>
                            <td colSpan="6">Nenhum animal encontrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Paginacao paginacao={paginacao} onTrocarPagina={setPagina} />
        </div>
    );
}

export default Animais;
