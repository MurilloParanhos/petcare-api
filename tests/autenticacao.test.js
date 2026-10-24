const request = require('supertest');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const { app } = require('./ajuda');

afterAll(() => pool.end());

describe('Autenticação', () => {
    test('rota protegida sem token responde 401', async () => {
        const resposta = await request(app).get('/api/clientes');
        expect(resposta.status).toBe(401);
    });

    test('token falso responde 401', async () => {
        const resposta = await request(app).get('/api/clientes').set('Authorization', 'Bearer abc.def.ghi');
        expect(resposta.status).toBe(401);
    });

    test('token vencido responde 401', async () => {
        const vencido = jwt.sign({ id: 1, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
        const resposta = await request(app).get('/api/clientes').set('Authorization', `Bearer ${vencido}`);
        expect(resposta.status).toBe(401);
    });

    test('cadastro e login devolvem um token com o nome do usuário', async () => {
        await request(app).post('/api/usuarios').send({ nome: 'Ana Teste', email: 'ana@teste.com', senha: 'segredo123' });

        const resposta = await request(app).post('/api/login').send({ email: 'ana@teste.com', senha: 'segredo123' });

        expect(resposta.status).toBe(200);
        expect(jwt.verify(resposta.body.token, process.env.JWT_SECRET).nome).toBe('Ana Teste');
    });

    test('login com senha errada responde 401', async () => {
        const resposta = await request(app).post('/api/login').send({ email: 'ana@teste.com', senha: 'errada' });
        expect(resposta.status).toBe(401);
    });
});
