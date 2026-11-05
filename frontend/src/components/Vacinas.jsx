import { useState } from 'react';
import { api } from '../api';
import { formatarTelefone, normalizar, paginar } from '../utils';
import { dataISO } from '../agenda';
import { situacaoDaDose, ultimasDoses } from '../vacinas';
import CampoData from './CampoData';
import CampoSelecao from './CampoSelecao';
import Paginacao from './Paginacao';

const FORM_VAZIO = { animal_id: '', nome: '', data_aplicacao: '', proxima_dose: '', observacoes: '' };

// Sugestoes para o campo "Vacina" (da para digitar qualquer outra)
const VACINAS_COMUNS = ['V10', 'V8', 'Antirrábica', 'Gripe canina', 'Giárdia', 'Leishmaniose', 'V4 felina', 'V5 felina'];

// Quantos dias para frente contam como "vencendo"
const DIAS_DE_AVISO = 30;

function somarDias(data, dias) {
    const nova = new Date(`${data}T00:00:00`);
    nova.setDate(nova.getDate() + dias);
    return dataISO(nova);
}

function umAnoDepois(data) {
    const nova = new Date(`${data}T00:00:00`);
    nova.setFullYear(nova.getFullYear() + 1);
    return dataISO(nova);
}

function formatarData(valor) {
    return valor ? new Date(valor).toLocaleDateString('pt-BR') : '-';
}

function Vacinas({ vacinas, animais, clientes, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [busca, setBusca] = useState('');
    const [pagina, setPagina] = useState(1);

    const hoje = dataISO(new Date());

    function petDaVacina(vacina) {
        return animais.find((a) => a.id === vacina.animal_id);
    }

    function donoDoPet(pet) {
        return clientes.find((c) => c.id === pet?.cliente_id);
    }

    const limiteDoAviso = somarDias(hoje, DIAS_DE_AVISO);
    const vencendo = ultimasDoses(vacinas)
        .filter((v) => v.proxima_dose && dataISO(v.proxima_dose) <= limiteDoAviso)
        .sort((a, b) => dataISO(a.proxima_dose).localeCompare(dataISO(b.proxima_dose)));

    const filtradas = vacinas
        .filter((v) => {
            const pet = petDaVacina(v);
            return [v.nome, pet?.nome, donoDoPet(pet)?.nome].some((campo) => normalizar(campo).includes(normalizar(busca)));
        })
        .sort((a, b) => dataISO(b.data_aplicacao).localeCompare(dataISO(a.data_aplicacao)));
    const paginacao = paginar(filtradas, pagina);

    const opcoesDePet = animais
        .map((a) => ({ valor: a.id, rotulo: `${a.nome} (${donoDoPet(a)?.nome ?? 'sem dono'})` }))
        .sort((a, b) => a.rotulo.localeCompare(b.rotulo));

    function mudarForm(novoForm) {
        setForm(novoForm);
        setSucesso('');
    }

    // Ao escolher a data de aplicacao, sugere a proxima dose para 1 ano depois
    function escolherAplicacao(data) {
        const sugerida = data && !form.proxima_dose ? umAnoDepois(data) : form.proxima_dose;
        mudarForm({ ...form, data_aplicacao: data, proxima_dose: sugerida });
    }

    function editar(vacina) {
        setForm({
            animal_id: vacina.animal_id,
            nome: vacina.nome,
            data_aplicacao: dataISO(vacina.data_aplicacao),
            proxima_dose: vacina.proxima_dose ? dataISO(vacina.proxima_dose) : '',
            observacoes: vacina.observacoes ?? ''
        });
        setEditandoId(vacina.id);
        setMsg('');
        setSucesso('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Botao "Registrar dose" do aviso: mesma vacina e mesmo pet, aplicada hoje
    function registrarDose(vacina) {
        setForm({ ...FORM_VAZIO, animal_id: vacina.animal_id, nome: vacina.nome, data_aplicacao: hoje, proxima_dose: umAnoDepois(hoje) });
        setEditandoId(null);
        setMsg('');
        setSucesso('');
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

        if (!form.animal_id || !form.nome.trim() || !form.data_aplicacao) {
            setMsg('Informe o pet, a vacina e a data de aplicação.');
            return;
        }

        const url = editandoId ? `/api/vacinas/${editandoId}` : '/api/vacinas';
        const method = editandoId ? 'PUT' : 'POST';

        try {
            await api(url, { method, body: { ...form, nome: form.nome.trim() } });
            const pet = animais.find((a) => a.id === Number(form.animal_id));
            cancelar();
            setSucesso(`${editandoId ? 'Vacina atualizada' : 'Vacina registrada'}: ${form.nome.trim()} de ${pet?.nome}.`);
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    async function excluir(vacina) {
        if (!confirm(`Excluir a dose de ${vacina.nome} de ${formatarData(vacina.data_aplicacao)}?`)) return;

        try {
            await api(`/api/vacinas/${vacina.id}`, { method: 'DELETE' });
            recarregar();
        } catch (erro) {
            alert(erro.message);
        }
    }

    return (
        <div>
            <h2>Vacinas</h2>
            <p className="subtitulo-aba">Carteira de vacinação dos pets. O aviso considera a dose mais recente de cada vacina.</p>

            <section className="painel vacinas-vencendo">
                <h3>Vencidas ou vencendo nos próximos {DIAS_DE_AVISO} dias</h3>
                {vencendo.length === 0 ? (
                    <p className="painel-vazio">Nenhuma vacina vencendo. Tudo em dia!</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Pet</th>
                                <th>Dono</th>
                                <th>Telefone</th>
                                <th>Vacina</th>
                                <th>Próxima dose</th>
                                <th>Situação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vencendo.map((vacina) => {
                                const pet = petDaVacina(vacina);
                                const dono = donoDoPet(pet);
                                const situacao = situacaoDaDose(vacina.proxima_dose, hoje, DIAS_DE_AVISO);
                                return (
                                    <tr key={vacina.id}>
                                        <td>{pet?.nome}</td>
                                        <td>{dono?.nome ?? '-'}</td>
                                        <td className="sem-quebra">{formatarTelefone(dono?.telefone) || '-'}</td>
                                        <td>{vacina.nome}</td>
                                        <td>{formatarData(vacina.proxima_dose)}</td>
                                        <td><span className={`selo ${situacao.classe}`}>{situacao.texto}</span></td>
                                        <td>
                                            <button className="btn-editar" onClick={() => registrarDose(vacina)}>Registrar dose</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="vacinaPet">Pet</label>
                    <CampoSelecao
                        id="vacinaPet"
                        valor={form.animal_id}
                        opcoes={opcoesDePet}
                        onChange={(valor) => mudarForm({ ...form, animal_id: valor })}
                        placeholder="Digite o pet ou o dono..."
                    />
                </div>
                <div>
                    <label htmlFor="vacinaNome">Vacina</label>
                    <input
                        type="text"
                        id="vacinaNome"
                        list="vacinasComuns"
                        placeholder="Ex: V10"
                        value={form.nome}
                        onChange={(e) => mudarForm({ ...form, nome: e.target.value })}
                    />
                    <datalist id="vacinasComuns">
                        {VACINAS_COMUNS.map((nome) => <option key={nome} value={nome} />)}
                    </datalist>
                </div>
                <div>
                    <label htmlFor="vacinaAplicacao">Aplicação</label>
                    <CampoData id="vacinaAplicacao" valor={form.data_aplicacao} onChange={escolherAplicacao} />
                </div>
                <div>
                    <label htmlFor="vacinaProxima">Próxima dose</label>
                    <CampoData id="vacinaProxima" valor={form.proxima_dose} onChange={(data) => mudarForm({ ...form, proxima_dose: data })} />
                </div>
                <div>
                    <label htmlFor="vacinaObs">Observações</label>
                    <input
                        type="text"
                        id="vacinaObs"
                        placeholder="Ex: lote, reação"
                        value={form.observacoes}
                        onChange={(e) => mudarForm({ ...form, observacoes: e.target.value })}
                    />
                </div>
                <button type="submit">{editandoId ? 'Salvar edição' : 'Registrar vacina'}</button>
                {editandoId && <button type="button" onClick={cancelar}>Cancelar</button>}
                <p className="erro">{msg}</p>
                {sucesso && (
                    <p className="form-sucesso">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{sucesso}</span>
                    </p>
                )}
            </form>

            <div className="filtros">
                <input
                    type="search"
                    placeholder="Buscar por pet, dono ou vacina..."
                    value={busca}
                    onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Pet</th>
                        <th>Dono</th>
                        <th>Vacina</th>
                        <th>Aplicação</th>
                        <th>Próxima dose</th>
                        <th>Observações</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {paginacao.itens.map((vacina) => {
                        const pet = petDaVacina(vacina);
                        return (
                            <tr key={vacina.id}>
                                <td>{pet?.nome}</td>
                                <td>{donoDoPet(pet)?.nome ?? '-'}</td>
                                <td>{vacina.nome}</td>
                                <td>{formatarData(vacina.data_aplicacao)}</td>
                                <td>{formatarData(vacina.proxima_dose)}</td>
                                <td>{vacina.observacoes ?? '-'}</td>
                                <td className="acoes">
                                    <button className="btn-editar" onClick={() => editar(vacina)}>Editar</button>
                                    <button className="btn-excluir" onClick={() => excluir(vacina)}>Excluir</button>
                                </td>
                            </tr>
                        );
                    })}
                    {filtradas.length === 0 && (
                        <tr>
                            <td colSpan="7">Nenhuma vacina registrada.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Paginacao paginacao={paginacao} onTrocarPagina={setPagina} />
        </div>
    );
}

export default Vacinas;
