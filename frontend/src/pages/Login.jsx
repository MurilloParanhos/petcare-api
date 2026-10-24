import { useState } from 'react';

// Email guardado no navegador quando "Lembrar meu usuario" esta marcado
const CHAVE_USUARIO_LEMBRADO = 'usuarioLembrado';

function Login({ aviso, onEntrar }) {
    const [email, setEmail] = useState(() => localStorage.getItem(CHAVE_USUARIO_LEMBRADO) ?? '');
    const [lembrar, setLembrar] = useState(() => Boolean(localStorage.getItem(CHAVE_USUARIO_LEMBRADO)));
    const [mostrarAjudaSenha, setMostrarAjudaSenha] = useState(false);
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mensagemErro, setMensagemErro] = useState(aviso ?? '');

    async function entrar(evento) {
        evento.preventDefault();

        try {
            const resposta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagemErro(dados.erro);
                return;
            }

            localStorage.setItem('token', dados.token);
            if (lembrar) {
                localStorage.setItem(CHAVE_USUARIO_LEMBRADO, email);
            } else {
                localStorage.removeItem(CHAVE_USUARIO_LEMBRADO);
            }
            onEntrar();

        } catch (erro) {
            console.error(erro);
            setMensagemErro('Erro ao conectar com o servidor.');
        }
    }

    return (
        <div className="login-container">

            <div className="login-lado-esquerdo">
                <div className="login-logo">
                    <span>PetCare</span>
                    <i className="fa-solid fa-paw"></i>
                </div>
                <div className="login-imagem">
                    <img src="/img/Dog.png" alt="Veterinária com um cachorro" />
                </div>
                <div className="login-frase">
                    <h1>Cuidando de quem sempre <span>está ao seu lado.</span></h1>
                    <p>Juntos por mais saúde, bem-estar e qualidade de vida para os pets.</p>
                </div>
            </div>

            <div className="login-lado-direito">
                <div className="login-logo-direita">
                    <span>PetCare</span>
                </div>
                <h2>Bem-vindo(a)!</h2>
                <p>Acesse sua conta para continuar.</p>

                <form id="formLogin" onSubmit={entrar}>
                    <div className="campo-com-icone">
                        <i className="fa-solid fa-user"></i>
                        <input
                            type="email"
                            placeholder="Usuário"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="campo-com-icone">
                        <i className="fa-solid fa-lock"></i>
                        <input
                            type={mostrarSenha ? 'text' : 'password'}
                            placeholder="Senha"
                            required
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />
                        <i
                            id="toggleSenha"
                            className={mostrarSenha ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                        ></i>
                    </div>

                    <div className="login-opcoes">
                        <label className="lembrar-usuario">
                            <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                            Lembrar meu usuário
                        </label>
                        <button type="button" className="esqueceu-senha" onClick={() => setMostrarAjudaSenha(!mostrarAjudaSenha)}>
                            Esqueceu sua senha?
                        </button>
                    </div>

                    {/* O sistema nao envia email; a senha e redefinida pelo administrador */}
                    {mostrarAjudaSenha && (
                        <p className="login-ajuda">
                            <i className="fa-solid fa-circle-info"></i>
                            <span>
                                Peça ao administrador do sistema para redefinir sua senha. Ele faz isso com o
                                comando <code>npm run redefinir-senha -- seu@email.com</code>.
                            </span>
                        </p>
                    )}

                    <button type="submit">Entrar</button>
                </form>

                <p style={{ color: 'red' }}>{mensagemErro}</p>
            </div>

        </div>
    );
}

export default Login;
