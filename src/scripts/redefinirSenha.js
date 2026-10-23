// Redefine a senha de um usuario direto no banco.
// Uso: npm run redefinir-senha -- email@exemplo.com

const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Nao mostra no terminal o que esta sendo digitado
rl._writeToOutput = () => {};

// Fila de linhas digitadas e de perguntas esperando resposta
const linhas = [];
const esperando = [];
rl.on('line', (linha) => {
    if (esperando.length) esperando.shift()(linha);
    else linhas.push(linha);
});

function perguntarEscondido(pergunta) {
    process.stdout.write(pergunta);
    const resposta = linhas.length ? Promise.resolve(linhas.shift()) : new Promise((r) => esperando.push(r));
    return resposta.then((texto) => {
        process.stdout.write('\n');
        return texto;
    });
}

async function redefinirSenha() {
    const email = process.argv[2];

    if (!email) {
        console.log('Informe o email. Exemplo: npm run redefinir-senha -- email@exemplo.com');
        return;
    }

    const senha = await perguntarEscondido('Nova senha: ');
    const confirmacao = await perguntarEscondido('Repita a nova senha: ');

    if (!senha) {
        console.log('A senha nao pode ser vazia.');
        return;
    }

    if (senha !== confirmacao) {
        console.log('As senhas nao conferem. Nada foi alterado.');
        return;
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
        'UPDATE usuarios SET senha = $1 WHERE email = $2',
        [senhaCriptografada, email]
    );

    if (resultado.rowCount === 0) {
        console.log(`Nenhum usuario encontrado com o email ${email}.`);
    } else {
        console.log(`Senha atualizada (${resultado.rowCount} usuario(s) com esse email).`);
    }
}

redefinirSenha()
    .catch((erro) => console.error('Erro ao redefinir senha:', erro.message))
    .finally(() => {
        rl.close();
        pool.end();
    });
