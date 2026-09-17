const formLogin = document.getElementById('formLogin');
const mensagemErro = document.getElementById('mensagemErro');

formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemErro.textContent = dados.erro;
            return;
        }

        localStorage.setItem('token', dados.token);
        window.location.href = 'dashboard.html';

    } catch (erro) {
        console.error(erro);
        mensagemErro.textContent = 'Erro ao conectar com o servidor.';
    }
});