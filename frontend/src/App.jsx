import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Se tem token salvo, mostra o dashboard; se nao, o login.
function App() {
    const [logado, setLogado] = useState(() => Boolean(localStorage.getItem('token')));

    function sair() {
        localStorage.removeItem('token');
        setLogado(false);
    }

    if (logado) {
        return <Dashboard onSair={sair} />;
    }

    return <Login onEntrar={() => setLogado(true)} />;
}

export default App;
