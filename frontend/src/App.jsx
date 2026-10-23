import { useEffect, useState } from 'react';
import { quandoSessaoExpirar } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Se tem token salvo, mostra o dashboard; se nao, o login.
function App() {
    const [logado, setLogado] = useState(() => Boolean(localStorage.getItem('token')));
    const [aviso, setAviso] = useState('');

    function sair(mensagem = '') {
        localStorage.removeItem('token');
        setAviso(mensagem);
        setLogado(false);
    }

    // Se qualquer chamada da API voltar 401, o token venceu: volta para o login
    useEffect(() => {
        quandoSessaoExpirar(() => sair('Sua sessão expirou. Faça login novamente.'));
    }, []);

    if (logado) {
        return <Dashboard onSair={() => sair()} />;
    }

    return <Login aviso={aviso} onEntrar={() => setLogado(true)} />;
}

export default App;
