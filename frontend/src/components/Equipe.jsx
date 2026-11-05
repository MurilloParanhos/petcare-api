import { useState } from 'react';
import { api } from '../api';
import { formatarMoeda } from '../utils';
import { dataISO, NOMES_DAS_FUNCOES } from '../agenda';
import CampoSelecao from './CampoSelecao';

const FORM_VAZIO = { nome: '', funcao: 'tosador' };

function doMesAtual(atendimento) {
    const hoje = new Date();
    const data = new Date(atendimento.data_atendimento);
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
}

// Numeros do mes de cada profissional: atendimentos concluidos, faltas,
// quanto faturou e quantos atendimentos ainda tem agendados daqui para frente
function desempenhoDoMes(profissionalId, atendimentos) {
    const doProfissional = atendimentos.filter((a) => a.profissional_id === profissionalId);
    const noMes = doProfissional.filter(doMesAtual);
    const concluidos = noMes.filter((a) => a.status === 'concluido');
    const hoje = dataISO(new Date());

    return {
        concluidos: concluidos.length,
        faltas: noMes.filter((a) => a.status === 'faltou').length,
        faturamento: concluidos.reduce((soma, a) => soma + Number(a.valor ?? 0), 0),
        agendados: doProfissional.filter((a) => a.status === 'agendado' && dataISO(a.data_atendimento) >= hoje).length
    };
}

function Equipe({ profissionais, atendimentos, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editando, setEditando] = useState(null);
    const [msg, setMsg] = useState('');

    function editar(profissional) {
        setForm({ nome: profissional.nome, funcao: profissional.funcao });
        setEditando(profissional);
        setMsg('');
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
        if (!nome) {
            setMsg('Informe o nome do profissional.');
            return;
        }

        try {
            if (editando) {
                await api(`/api/profissionais/${editando.id}`, {
                    method: 'PUT',
                    body: { nome, funcao: form.funcao, ativo: editando.ativo }
                });
            } else {
                await api('/api/profissionais', { method: 'POST', body: { nome, funcao: form.funcao } });
            }
            cancelar();
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    // Quem sai da equipe e desativado (nao excluido), para o historico continuar certo
    async function alternarAtivo(profissional) {
        try {
            await api(`/api/profissionais/${profissional.id}`, {
                method: 'PUT',
                body: { nome: profissional.nome, funcao: profissional.funcao, ativo: !profissional.ativo }
            });
            recarregar();
        } catch (erro) {
            alert(erro.message);
        }
    }

    // Ativos primeiro, depois por funcao e nome
    const ordenados = [...profissionais].sort((a, b) =>
        Number(b.ativo) - Number(a.ativo) || a.funcao.localeCompare(b.funcao) || a.nome.localeCompare(b.nome)
    );

    return (
        <div>
            <h2>Equipe</h2>
            <p className="subtitulo-aba">
                Cada profissional tem a sua agenda: dois atendimentos no mesmo horário vão para profissionais diferentes.
                Os números são do mês atual.
            </p>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="profissionalNome">Nome</label>
                    <input
                        type="text"
                        id="profissionalNome"
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="profissionalFuncao">Função</label>
                    <CampoSelecao
                        id="profissionalFuncao"
                        valor={form.funcao}
                        opcoes={Object.entries(NOMES_DAS_FUNCOES).map(([funcao, nome]) => ({ valor: funcao, rotulo: nome }))}
                        onChange={(valor) => setForm({ ...form, funcao: valor })}
                        buscavel={false}
                    />
                </div>
                <button type="submit">{editando ? 'Salvar edição' : 'Adicionar profissional'}</button>
                {editando && <button type="button" onClick={cancelar}>Cancelar</button>}
                <p className="erro">{msg}</p>
            </form>

            <table>
                <thead>
                    <tr>
                        <th>Profissional</th>
                        <th>Função</th>
                        <th>Concluídos no mês</th>
                        <th>Faltas no mês</th>
                        <th>Faturamento no mês</th>
                        <th>Próximos agendados</th>
                        <th>Situação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {ordenados.map((profissional) => {
                        const numeros = desempenhoDoMes(profissional.id, atendimentos);
                        return (
                            <tr key={profissional.id} className={profissional.ativo ? '' : 'linha-inativa'}>
                                <td>
                                    <span className="especie">
                                        <i className={`fa-solid ${profissional.funcao === 'veterinario' ? 'fa-user-doctor' : 'fa-scissors'}`}></i>
                                        {profissional.nome}
                                    </span>
                                </td>
                                <td>{NOMES_DAS_FUNCOES[profissional.funcao]}</td>
                                <td>{numeros.concluidos}</td>
                                <td>{numeros.faltas}</td>
                                <td>{formatarMoeda(numeros.faturamento)}</td>
                                <td>{numeros.agendados}</td>
                                <td>{profissional.ativo ? 'Ativo' : 'Desativado'}</td>
                                <td className="acoes">
                                    <button className="btn-editar" onClick={() => editar(profissional)}>Editar</button>
                                    <button
                                        className={profissional.ativo ? 'btn-excluir' : 'btn-editar'}
                                        onClick={() => alternarAtivo(profissional)}
                                    >
                                        {profissional.ativo ? 'Desativar' : 'Ativar'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {profissionais.length === 0 && (
                        <tr>
                            <td colSpan="8">Nenhum profissional cadastrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Equipe;
