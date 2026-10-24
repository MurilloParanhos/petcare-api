import { diaFechado, STATUS_DO_ATENDIMENTO } from '../../agenda';
import CampoData from '../CampoData';
import CampoSelecao from '../CampoSelecao';

// So a tela do formulario. Toda a logica vem do hook useFormularioAtendimento,
// recebido aqui em "formulario".
function FormularioAtendimento({ formulario, clientes }) {
    const {
        form, editandoId, msg,
        animaisDoCliente, servicosDoFormulario, horariosDoFormulario, profissionaisDoFormulario,
        alterarCampo, definirCampo, escolherCliente, escolherServico, escolherData, escolherHora,
        cancelar, salvar
    } = formulario;

    const petsDoCliente = animaisDoCliente(form.cliente_id);

    return (
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
                    opcoes={petsDoCliente.map((a) => ({ valor: a.id, rotulo: a.nome }))}
                    onChange={(valor) => definirCampo('animal_id', valor)}
                    desabilitado={petsDoCliente.length === 0}
                    buscavel={false}
                    placeholder={!form.cliente_id
                        ? 'Escolha o cliente'
                        : petsDoCliente.length === 0 ? 'Cliente sem pets' : 'Selecione...'}
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
                <CampoData id="atendimentoData" valor={form.data_atendimento} onChange={escolherData} bloquearFechados />
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
                    placeholder={!form.data_atendimento || !form.servico_id
                        ? 'Escolha serviço e data'
                        : diaFechado(form.data_atendimento) ? 'Fechado aos domingos' : 'Dia lotado'}
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
            {editandoId && (
                <div>
                    <label htmlFor="atendimentoStatus">Status</label>
                    <CampoSelecao
                        id="atendimentoStatus"
                        valor={form.status}
                        opcoes={Object.entries(STATUS_DO_ATENDIMENTO).map(([valor, info]) => ({ valor, rotulo: info.nome }))}
                        onChange={(valor) => definirCampo('status', valor)}
                        buscavel={false}
                    />
                </div>
            )}
            <button type="submit">{editandoId ? 'Salvar edição' : 'Registrar atendimento'}</button>
            {editandoId && <button type="button" onClick={cancelar}>Cancelar</button>}
            <p className="erro">{msg}</p>
        </form>
    );
}

export default FormularioAtendimento;
