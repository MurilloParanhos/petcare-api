const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function cadastrarUsuario(req, res) {
    const nome = (req.body.nome ?? '').trim();
    const email = (req.body.email ?? '').trim().toLowerCase();
    const senha = req.body.senha ?? '';

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Informe nome, email e senha.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ erro: 'Email inválido.' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
    }

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const resultado = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
            [nome, email, senhaCriptografada]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        // 23505 = violacao de UNIQUE: ja existe usuario com esse email
        if (erro.code === '23505') {
            return res.status(400).json({ erro: 'Já existe um usuário com esse email.' });
        }
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
}

async function login(req, res) {
    const email = (req.body.email ?? '').trim().toLowerCase();
    const senha = req.body.senha ?? '';

    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao fazer login.' });
    }
}

module.exports = { cadastrarUsuario, login };
