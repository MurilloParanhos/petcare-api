import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Verde das barras: da mesma familia da marca, mas vivo o bastante para ler como dado
const COR_BARRA = '#3a8a5c';
const COR_GRADE = '#eeeeee';
const COR_TEXTO = '#666666';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function inicioDeHoje() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
}

// Conta os atendimentos de cada um dos ultimos 6 meses (incluindo o atual)
function atendimentosPorMes(atendimentos) {
    const hoje = new Date();
    const meses = [];

    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        meses.push({ ano: data.getFullYear(), mes: data.getMonth(), nome: MESES[data.getMonth()], total: 0 });
    }

    atendimentos.forEach((atendimento) => {
        const data = new Date(atendimento.data_atendimento);
        const mes = meses.find((m) => m.ano === data.getFullYear() && m.mes === data.getMonth());
        if (mes) mes.total++;
    });

    return meses;
}

// Agrupa por servico ignorando maiusculas e espacos ("banho" e "Banho " contam juntos)
function servicosMaisProcurados(atendimentos) {
    const contagem = {};

    atendimentos.forEach((atendimento) => {
        const nome = atendimento.tipo_servico.trim();
        const chave = nome.toLowerCase();
        if (!contagem[chave]) contagem[chave] = { nome, total: 0 };
        contagem[chave].total++;
    });

    return Object.values(contagem)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
}

function proximosAtendimentos(atendimentos) {
    const hoje = inicioDeHoje();

    return atendimentos
        .filter((atendimento) => new Date(atendimento.data_atendimento) >= hoje)
        .sort((a, b) => new Date(a.data_atendimento) - new Date(b.data_atendimento))
        .slice(0, 5);
}

function Resumo({ totalClientes, totalAnimais, atendimentos, inativos, clientes }) {
    const hoje = new Date();
    const atendimentosNoMes = atendimentos.filter((atendimento) => {
        const data = new Date(atendimento.data_atendimento);
        return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth();
    }).length;

    const porMes = atendimentosPorMes(atendimentos);
    const servicos = servicosMaisProcurados(atendimentos);
    const proximos = proximosAtendimentos(atendimentos);

    function nomeDoCliente(clienteId) {
        return clientes.find((c) => c.id === clienteId)?.nome ?? `Cliente #${clienteId}`;
    }

    return (
        <div>
            <h1>Olá!</h1>
            <p>Aqui está um resumo do sistema.</p>

            <section className="cards">
                <div className="card">
                    <h3>Clientes cadastrados</h3>
                    <p>{totalClientes}</p>
                </div>
                <div className="card">
                    <h3>Animais cadastrados</h3>
                    <p>{totalAnimais}</p>
                </div>
                <div className="card">
                    <h3>Atendimentos no mês</h3>
                    <p>{atendimentosNoMes}</p>
                </div>
                <div className={inativos.length > 0 ? 'card card-alerta' : 'card'}>
                    <h3>Clientes inativos</h3>
                    <p>{inativos.length}</p>
                    {inativos.length > 0 && (
                        <span className="card-aviso">
                            <i className="fa-solid fa-triangle-exclamation"></i> Precisam de contato
                        </span>
                    )}
                </div>
            </section>

            <section className="graficos">
                <div className="painel">
                    <h3>Atendimentos por mês</h3>
                    <p className="painel-subtitulo">Últimos 6 meses</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={porMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke={COR_GRADE} />
                            <XAxis dataKey="nome" tickLine={false} axisLine={{ stroke: COR_GRADE }} tick={{ fill: COR_TEXTO, fontSize: 12 }} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: COR_TEXTO, fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                                formatter={(valor) => [valor, 'Atendimentos']}
                            />
                            <Bar dataKey="total" fill={COR_BARRA} radius={[4, 4, 0, 0]} maxBarSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="painel">
                    <h3>Serviços mais procurados</h3>
                    <p className="painel-subtitulo">Top 5, todos os atendimentos</p>
                    {servicos.length === 0 ? (
                        <p className="painel-vazio">Nenhum atendimento registrado ainda.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={servicos} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis type="number" hide allowDecimals={false} />
                                <YAxis type="category" dataKey="nome" width={120} tickLine={false} axisLine={false} tick={{ fill: COR_TEXTO, fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                                    formatter={(valor) => [valor, 'Atendimentos']}
                                />
                                <Bar dataKey="total" fill={COR_BARRA} radius={[0, 4, 4, 0]} maxBarSize={24}>
                                    <LabelList dataKey="total" position="right" fill="#333333" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            <section className="painel">
                <h3>Próximos atendimentos</h3>
                {proximos.length === 0 ? (
                    <p className="painel-vazio">Nenhum atendimento agendado.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Serviço</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proximos.map((atendimento) => (
                                <tr key={atendimento.id}>
                                    <td>{new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR')}</td>
                                    <td>{nomeDoCliente(atendimento.cliente_id)}</td>
                                    <td>{atendimento.tipo_servico}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default Resumo;
