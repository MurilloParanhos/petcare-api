import { useEffect, useState } from 'react';
import { api } from '../api';
import Sidebar from '../components/Sidebar';
import Resumo from '../components/Resumo';
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

    // Roda uma vez quando o dashboard aparece na tela
    useEffect(() => {
        carregarClientes();
        carregarAnimais();
        carregarAtendimentos();
        carregarServicos();
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
                        recarregar={carregarAtendimentos}
                    />
                )}
                {aba === 'servicos' && (
                    <Servicos servicos={servicos} recarregar={carregarServicos} />
                )}
            </main>
        </>
    );
}

export default Dashboard;
