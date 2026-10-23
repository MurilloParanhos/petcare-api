import { useState } from 'react';
import { api } from '../api';

const FORM_VAZIO = { cliente_id: '', tipo_servico: '', data_atendimento: '', observacoes: '' };

function Atendimentos({ atendimentos, inativos, clientes, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');

    function nomeDoCliente(clienteId) {
        return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
    }

    // Verde para atendimento que ja passou, amarelo para agendado
    function classeDaLinha(atendimento) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return new Date(atendimento.data_atendimento) < hoje ? 'atendimento-realizado' : 'atendimento-agendado';
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
                    {atendimentos.map((atendimento) => (
                        <tr key={atendimento.id} className={classeDaLinha(atendimento)}>
                            <td>{nomeDoCliente(atendimento.cliente_id)}</td>
                            <td>{atendimento.tipo_servico}</td>
                            <td>{new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR')}</td>
                            <td>{atendimento.observacoes ?? '-'}</td>
                            <td>
                                <button className="btn-editar" onClick={() => editar(atendimento)}>Editar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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

            <h2>Clientes Inativos (Sem atendimento há mais de 60 dias)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Telefone</th>
                        <th>Último Atendimento</th>
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
                        </tr>
                    ))}
                    {inativos.length === 0 && (
                        <tr>
                            <td colSpan="3">Nenhum cliente inativo. 🎉</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Atendimentos;
