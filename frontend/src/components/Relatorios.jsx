import { useState } from 'react';
import { formatarMoeda } from '../utils';
import { dataISO, STATUS_DO_ATENDIMENTO } from '../agenda';
import CampoData from './CampoData';

// Periodos prontos: cada um devolve [inicio, fim] no formato "2026-11-05"
const PERIODOS = [
    { id: 'mes', nome: 'Este mês' },
    { id: 'mesPassado', nome: 'Mês passado' },
    { id: '30', nome: 'Últimos 30 dias' },
    { id: '90', nome: 'Últimos 90 dias' },
    { id: 'ano', nome: 'Este ano' },
    { id: 'personalizado', nome: 'Personalizado' }
];

function intervaloDoPeriodo(id) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diasAtras = (dias) => {
        const data = new Date(hoje);
        data.setDate(data.getDate() - dias + 1);
        return data;
    };

    switch (id) {
        case 'mesPassado': return [dataISO(new Date(ano, mes - 1, 1)), dataISO(new Date(ano, mes, 0))];
        case '30': return [dataISO(diasAtras(30)), dataISO(hoje)];
        case '90': return [dataISO(diasAtras(90)), dataISO(hoje)];
        case 'ano': return [dataISO(new Date(ano, 0, 1)), dataISO(new Date(ano, 11, 31))];
        default: return [dataISO(new Date(ano, mes, 1)), dataISO(new Date(ano, mes + 1, 0))];
    }
}

function porcentagem(parte, total) {
    return total ? `${Math.round((parte / total) * 100)}%` : '-';
}

// Agrupa os atendimentos por uma chave e soma concluidos, faltas e receita
function agrupar(atendimentos, chaveDe) {
    const grupos = {};
    atendimentos.forEach((a) => {
        const chave = chaveDe(a);
        const grupo = (grupos[chave] ??= { chave, concluidos: 0, faltas: 0, cancelados: 0, receita: 0 });
        if (a.status === 'concluido') {
            grupo.concluidos++;
            grupo.receita += Number(a.valor ?? 0);
        }
        if (a.status === 'faltou') grupo.faltas++;
        if (a.status === 'cancelado') grupo.cancelados++;
    });
    return Object.values(grupos).sort((a, b) => b.receita - a.receita || b.concluidos - a.concluidos);
}

// CSV no formato que o Excel brasileiro abre direto: separado por ";",
// virgula nos centavos e BOM no inicio para os acentos aparecerem certos
function baixarCsv(nomeDoArquivo, linhas) {
    const escapar = (valor) => {
        const texto = String(valor ?? '');
        return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };
    const conteudo = '﻿' + linhas.map((linha) => linha.map(escapar).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeDoArquivo;
    link.click();
    URL.revokeObjectURL(url);
}

function Relatorios({ atendimentos, clientes, animais, profissionais }) {
    const [periodo, setPeriodo] = useState('mes');
    const [personalizado, setPersonalizado] = useState(() => intervaloDoPeriodo('mes'));

    const [inicio, fim] = periodo === 'personalizado' ? personalizado : intervaloDoPeriodo(periodo);

    const nomeDoCliente = (id) => clientes.find((c) => c.id === id)?.nome ?? `Cliente #${id}`;
    const nomeDoPet = (id) => animais.find((a) => a.id === id)?.nome ?? '-';
    const nomeDoProfissional = (id) => profissionais.find((p) => p.id === id)?.nome ?? '-';

    const doPeriodo = atendimentos
        .filter((a) => {
            const data = dataISO(a.data_atendimento);
            return data >= inicio && data <= fim;
        })
        .sort((a, b) => `${dataISO(a.data_atendimento)} ${a.hora_atendimento}`.localeCompare(`${dataISO(b.data_atendimento)} ${b.hora_atendimento}`));

    const concluidos = doPeriodo.filter((a) => a.status === 'concluido');
    const faturamento = concluidos.reduce((soma, a) => soma + Number(a.valor ?? 0), 0);
    // Taxa de perda: faltas e cancelamentos sobre tudo que ja teve desfecho (agendados ficam de fora)
    const comDesfecho = doPeriodo.filter((a) => a.status !== 'agendado');
    const perdidos = comDesfecho.filter((a) => a.status === 'faltou' || a.status === 'cancelado');

    const porServico = agrupar(doPeriodo, (a) => a.tipo_servico);
    const porProfissional = agrupar(doPeriodo, (a) => nomeDoProfissional(a.profissional_id));
    const melhoresClientes = agrupar(concluidos, (a) => nomeDoCliente(a.cliente_id)).slice(0, 5);

    function exportar() {
        const cabecalho = ['Data', 'Horário', 'Cliente', 'Pet', 'Serviço', 'Profissional', 'Status', 'Valor (R$)', 'Observações'];
        const linhas = doPeriodo.map((a) => [
            new Date(a.data_atendimento).toLocaleDateString('pt-BR'),
            (a.hora_atendimento ?? '').slice(0, 5),
            nomeDoCliente(a.cliente_id),
            nomeDoPet(a.animal_id),
            a.tipo_servico,
            nomeDoProfissional(a.profissional_id),
            STATUS_DO_ATENDIMENTO[a.status].nome,
            Number(a.valor ?? 0).toFixed(2).replace('.', ','),
            a.observacoes ?? ''
        ]);
        baixarCsv(`atendimentos_${inicio}_a_${fim}.csv`, [cabecalho, ...linhas]);
    }

    return (
        <div>
            <h2>Relatórios</h2>
            <p className="subtitulo-aba">
                Faturamento e ticket médio contam só os atendimentos concluídos.
                Período: {new Date(`${inicio}T00:00:00`).toLocaleDateString('pt-BR')} a {new Date(`${fim}T00:00:00`).toLocaleDateString('pt-BR')}.
            </p>

            <div className="filtros">
                <div className="grupo-botoes">
                    {PERIODOS.map((p) => (
                        <button key={p.id} className={periodo === p.id ? 'ativo' : ''} onClick={() => setPeriodo(p.id)}>
                            {p.nome}
                        </button>
                    ))}
                </div>
                {periodo === 'personalizado' && (
                    <div className="relatorio-datas">
                        <CampoData id="relatorioInicio" valor={personalizado[0]} onChange={(data) => data && setPersonalizado([data, personalizado[1]])} />
                        <span>até</span>
                        <CampoData id="relatorioFim" valor={personalizado[1]} onChange={(data) => data && setPersonalizado([personalizado[0], data])} />
                    </div>
                )}
                <button className="btn-secundario relatorio-exportar" onClick={exportar} disabled={doPeriodo.length === 0}>
                    <i className="fa-solid fa-file-excel"></i> Exportar para Excel
                </button>
            </div>

            <section className="cards">
                <div className="card">
                    <h3>Faturamento</h3>
                    <p>{formatarMoeda(faturamento)}</p>
                </div>
                <div className="card">
                    <h3>Atendimentos concluídos</h3>
                    <p>{concluidos.length}</p>
                    <span className="card-detalhe">{doPeriodo.length} no período, em todos os status</span>
                </div>
                <div className="card">
                    <h3>Ticket médio</h3>
                    <p>{concluidos.length ? formatarMoeda(faturamento / concluidos.length) : '-'}</p>
                    <span className="card-detalhe">Valor médio por atendimento</span>
                </div>
                <div className={perdidos.length > 0 ? 'card card-alerta' : 'card'}>
                    <h3>Faltas e cancelamentos</h3>
                    <p>{porcentagem(perdidos.length, comDesfecho.length)}</p>
                    <span className="card-detalhe">{perdidos.length} de {comDesfecho.length} atendimentos</span>
                </div>
            </section>

            <section className="graficos">
                <div className="painel">
                    <h3>Por serviço</h3>
                    <table>
                        <thead>
                            <tr><th>Serviço</th><th>Concluídos</th><th>Faturamento</th><th>% do total</th></tr>
                        </thead>
                        <tbody>
                            {porServico.map((g) => (
                                <tr key={g.chave}>
                                    <td>{g.chave}</td>
                                    <td>{g.concluidos}</td>
                                    <td>{formatarMoeda(g.receita)}</td>
                                    <td>{porcentagem(g.receita, faturamento)}</td>
                                </tr>
                            ))}
                            {porServico.length === 0 && <tr><td colSpan="4">Nenhum atendimento no período.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div className="painel">
                    <h3>Por profissional</h3>
                    <table>
                        <thead>
                            <tr><th>Profissional</th><th>Concluídos</th><th>Faltas</th><th>Faturamento</th></tr>
                        </thead>
                        <tbody>
                            {porProfissional.map((g) => (
                                <tr key={g.chave}>
                                    <td>{g.chave}</td>
                                    <td>{g.concluidos}</td>
                                    <td>{g.faltas}</td>
                                    <td>{formatarMoeda(g.receita)}</td>
                                </tr>
                            ))}
                            {porProfissional.length === 0 && <tr><td colSpan="4">Nenhum atendimento no período.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="painel">
                <h3>Clientes que mais gastaram</h3>
                <table>
                    <thead>
                        <tr><th>Cliente</th><th>Atendimentos concluídos</th><th>Total gasto</th></tr>
                    </thead>
                    <tbody>
                        {melhoresClientes.map((g) => (
                            <tr key={g.chave}>
                                <td>{g.chave}</td>
                                <td>{g.concluidos}</td>
                                <td>{formatarMoeda(g.receita)}</td>
                            </tr>
                        ))}
                        {melhoresClientes.length === 0 && <tr><td colSpan="3">Nenhum atendimento concluído no período.</td></tr>}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

export default Relatorios;
