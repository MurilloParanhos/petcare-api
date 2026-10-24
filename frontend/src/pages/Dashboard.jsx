import { useEffect, useState } from 'react';
import { api } from '../api';
import Sidebar from '../components/Sidebar';
import Resumo from '../components/Resumo';
import Agenda from '../components/Agenda';
import Clientes from '../components/Clientes';
import Animais from '../components/Animais';
import Atendimentos from '../components/Atendimentos';
import Servicos from '../components/Servicos';

function Dashboard({ onSair }) {
    const [aba, setAba] = useState('resumo');
    const [clientes, setClientes] = useState([]);
    const [animais, setAnimais] = useState([]);
    const [atendimentos, setAtendimentos] = useState([]);
    const [inativos, setInativos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [profissionais, setProfissionais] = useState([]);
    // Dados que a Agenda manda para o formulario de Atendimentos (data, hora e profissional)
    const [preenchimento, setPreenchimento] = useState(null);

    async function carregarClientes() {
        try {
            setClientes(await api('/api/clientes'));
        } catch (erro) {
            console.error(erro);
        }
    }

    async function carregarAnimais() {
        try {
            setAnimais(await api('/api/animais'));
        } catch (erro) {
            console.error(erro);
        }
    }

    async function carregarServicos() {
        try {
            setServicos(await api('/api/servicos'));
        } catch (erro) {
            console.error(erro);
        }
    }

    async function carregarProfissionais() {
        try {
            setProfissionais(await api('/api/profissionais'));
        } catch (erro) {
            console.error(erro);
        }
    }

    // Carrega os atendimentos e os clientes inativos juntos, porque
    // salvar um atendimento pode tirar alguem da lista de inativos
    async function carregarAtendimentos() {
        try {
            const [listaAtendimentos, listaInativos] = await Promise.all([
                api('/api/atendimentos'),
                api('/api/atendimentos/inativos')
            ]);
            setAtendimentos(listaAtendimentos);
            setInativos(listaInativos);
        } catch (erro) {
            console.error(erro);
        }
    }

    // Botoes Concluir, Faltou, Cancelar e Reabrir (usados na Agenda e em Atendimentos)
    async function mudarStatus(atendimento, novoStatus) {
        if (novoStatus === 'cancelado' && !confirm('Cancelar esse atendimento? O horário fica livre na agenda.')) return;

        try {
            await api(`/api/atendimentos/${atendimento.id}/status`, { method: 'PATCH', body: { status: novoStatus } });
            carregarAtendimentos();
        } catch (erro) {
            alert(erro.message);
        }
    }

    // Clique num horario livre da Agenda: vai para Atendimentos com o formulario preenchido
    function agendarPelaAgenda(dados) {
        setPreenchimento(dados);
        setAba('atendimentos');
    }

    // Botao Editar no detalhe da Agenda: abre o atendimento no formulario
    function editarPelaAgenda(atendimento) {
        setPreenchimento({ editarId: atendimento.id });
        setAba('atendimentos');
    }

    // Roda uma vez quando o dashboard aparece na tela
    useEffect(() => {
        carregarClientes();
        carregarAnimais();
        carregarAtendimentos();
        carregarServicos();
        carregarProfissionais();
    }, []);

    return (
        <>
            <Sidebar abaAtual={aba} onTrocarAba={setAba} onSair={onSair} totalInativos={inativos.length} />

            <main className="conteudo">
                {aba === 'resumo' && (
                    <Resumo
                        totalClientes={clientes.length}
                        totalAnimais={animais.length}
                        atendimentos={atendimentos}
                        inativos={inativos}
                        clientes={clientes}
                        animais={animais}
                        servicos={servicos}
                        profissionais={profissionais}
                    />
                )}
                {aba === 'agenda' && (
                    <Agenda
                        atendimentos={atendimentos}
                        clientes={clientes}
                        animais={animais}
                        servicos={servicos}
                        profissionais={profissionais}
                        mudarStatus={mudarStatus}
                        onAgendar={agendarPelaAgenda}
                        onEditar={editarPelaAgenda}
                    />
                )}
                {aba === 'clientes' && (
                    <Clientes clientes={clientes} recarregar={carregarClientes} />
                )}
                {aba === 'animais' && (
                    <Animais animais={animais} clientes={clientes} recarregar={carregarAnimais} />
                )}
                {aba === 'atendimentos' && (
                    <Atendimentos
                        atendimentos={atendimentos}
                        inativos={inativos}
                        clientes={clientes}
                        animais={animais}
                        servicos={servicos}
                        profissionais={profissionais}
                        recarregar={carregarAtendimentos}
                        mudarStatus={mudarStatus}
                        preenchimento={preenchimento}
                        onPreenchido={() => setPreenchimento(null)}
                    />
                )}
                {aba === 'servicos' && (
                    <Servicos servicos={servicos} profissionais={profissionais} recarregar={carregarServicos} />
                )}
            </main>
        </>
    );
}

export default Dashboard;
