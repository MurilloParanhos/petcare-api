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

const toggleSenha = document.getElementById('toggleSenha');
const campoSenha = document.getElementById('senha');

toggleSenha.addEventListener('click', () => {
    if (campoSenha.type === 'password') {
        campoSenha.type = 'text';
        toggleSenha.classList.remove('fa-eye');
        toggleSenha.classList.add('fa-eye-slash');
    } else {
        campoSenha.type = 'password';
        toggleSenha.classList.remove('fa-eye-slash');
        toggleSenha.classList.add('fa-eye');
    }
});