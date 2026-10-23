import { useEffect, useState } from 'react';
import { api } from '../api';
import Sidebar from '../components/Sidebar';
import Resumo from '../components/Resumo';
import Clientes from '../components/Clientes';
import Animais from '../components/Animais';
import Atendimentos from '../components/Atendimentos';

function Dashboard({ onSair }) {
    const [aba, setAba] = useState('resumo');
    const [clientes, setClientes] = useState([]);
    const [animais, setAnimais] = useState([]);

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

    // Roda uma vez quando o dashboard aparece na tela
    useEffect(() => {
        carregarClientes();
        carregarAnimais();
    }, []);

    return (
        <>
            <Sidebar abaAtual={aba} onTrocarAba={setAba} onSair={onSair} />

            <main className="conteudo">
                {aba === 'resumo' && (
                    <Resumo totalClientes={clientes.length} totalAnimais={animais.length} />
                )}
                {aba === 'clientes' && (
                    <Clientes clientes={clientes} recarregar={carregarClientes} />
                )}
                {aba === 'animais' && (
                    <Animais animais={animais} clientes={clientes} recarregar={carregarAnimais} />
                )}
                {aba === 'atendimentos' && (
                    <Atendimentos clientes={clientes} />
                )}
            </main>
        </>
    );
}

export default Dashboard;
