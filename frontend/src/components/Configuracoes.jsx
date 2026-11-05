import { useState } from 'react';
import { api } from '../api';
import { horaTexto, REGRAS } from '../agenda';
import CampoSelecao from './CampoSelecao';

const DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Horarios de 05:00 a 23:00, de 30 em 30 minutos, para as listas
const HORARIOS = [];
for (let minutos = 5 * 60; minutos <= 23 * 60; minutos += 30) {
    const hora = horaTexto(minutos);
    HORARIOS.push({ valor: hora, rotulo: hora });
}

const INTERVALOS = [15, 30, 60].map((minutos) => ({ valor: minutos, rotulo: `${minutos} minutos` }));

function Configuracoes({ onSalvo }) {
    // Copia das regras atuais para editar sem mexer nas que estao valendo
    const [form, setForm] = useState(() => ({
        abertura: REGRAS.abertura,
        fechamento: REGRAS.fechamento,
        almocoInicio: REGRAS.almoco.inicio,
        almocoFim: REGRAS.almoco.fim,
        intervaloMinutos: REGRAS.intervaloMinutos,
        diasFechados: [...REGRAS.diasFechados]
    }));
    const [msg, setMsg] = useState('');
    const [sucesso, setSucesso] = useState('');

    function mudar(campo, valor) {
        setForm({ ...form, [campo]: valor });
        setSucesso('');
    }

    function alternarDia(dia) {
        const fechados = form.diasFechados.includes(dia)
            ? form.diasFechados.filter((d) => d !== dia)
            : [...form.diasFechados, dia];
        mudar('diasFechados', fechados);
    }

    async function salvar(evento) {
        evento.preventDefault();
        setMsg('');

        try {
            const regras = await api('/api/configuracoes/agenda', {
                method: 'PUT',
                body: {
                    abertura: form.abertura,
                    fechamento: form.fechamento,
                    almoco: { inicio: form.almocoInicio, fim: form.almocoFim },
                    intervaloMinutos: form.intervaloMinutos,
                    diasFechados: form.diasFechados
                }
            });
            onSalvo(regras);
            setSucesso('Configurações salvas. A Agenda e o formulário de atendimento já usam os novos horários.');
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    const abertos = DIAS_DA_SEMANA.filter((_, dia) => !form.diasFechados.includes(dia));

    return (
        <div>
            <h2>Configurações</h2>
            <p className="subtitulo-aba">
                Horário de funcionamento usado pela Agenda, pelas sugestões de horário e pela validação da API.
                Mudanças valem para os próximos agendamentos; os que já existem continuam onde estão.
            </p>

            <form className="formulario" onSubmit={salvar}>
                <div>
                    <label htmlFor="configAbertura">Abre às</label>
                    <CampoSelecao id="configAbertura" valor={form.abertura} opcoes={HORARIOS} onChange={(v) => mudar('abertura', v)} />
                </div>
                <div>
                    <label htmlFor="configFechamento">Fecha às</label>
                    <CampoSelecao id="configFechamento" valor={form.fechamento} opcoes={HORARIOS} onChange={(v) => mudar('fechamento', v)} />
                </div>
                <div>
                    <label htmlFor="configAlmocoInicio">Almoço das</label>
                    <CampoSelecao id="configAlmocoInicio" valor={form.almocoInicio} opcoes={HORARIOS} onChange={(v) => mudar('almocoInicio', v)} />
                </div>
                <div>
                    <label htmlFor="configAlmocoFim">até</label>
                    <CampoSelecao id="configAlmocoFim" valor={form.almocoFim} opcoes={HORARIOS} onChange={(v) => mudar('almocoFim', v)} />
                </div>
                <div>
                    <label htmlFor="configIntervalo">Horários de</label>
                    <CampoSelecao
                        id="configIntervalo"
                        valor={form.intervaloMinutos}
                        opcoes={INTERVALOS}
                        onChange={(v) => mudar('intervaloMinutos', v)}
                        buscavel={false}
                    />
                </div>

                <fieldset className="config-dias">
                    <legend>Dias em que o pet shop fecha</legend>
                    {DIAS_DA_SEMANA.map((nome, dia) => (
                        <label key={nome} className="config-dia">
                            <input type="checkbox" checked={form.diasFechados.includes(dia)} onChange={() => alternarDia(dia)} />
                            {nome}
                        </label>
                    ))}
                </fieldset>

                <p className="config-resumo">
                    <strong>Dias abertos:</strong> {abertos.length === 7 ? 'todos os dias' : abertos.join(', ')}.{' '}
                    <strong>Horário:</strong> das {form.abertura} às {form.fechamento}, com almoço das {form.almocoInicio} às {form.almocoFim}.
                </p>

                <button type="submit">Salvar configurações</button>
                <p className="erro">{msg}</p>
                {sucesso && (
                    <p className="form-sucesso">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{sucesso}</span>
                    </p>
                )}
            </form>
        </div>
    );
}

export default Configuracoes;
