const request = require('supertest');
const pool = require('../src/config/db');
const { app, api, token, criarClienteComPet, idsPorNome } = require('./ajuda');

// DELETE nao esta no atalho api(), entao monta a requisicao com o token aqui
function excluirCliente(id) {
    return request(app).delete(`/api/clientes/${id}`).set('Authorization', `Bearer ${token()}`);
}

afterAll(() => pool.end());

describe('Clientes', () => {
    test('guarda o telefone só com números', async () => {
        const resposta = await api().post('/api/clientes').send({ nome: 'Dani', telefone: '(11) 98765-4321', email: '' });

        expect(resposta.status).toBe(201);
        expect(resposta.body.telefone).toBe('11987654321');
        expect(resposta.body.email).toBeNull();
    });

    test.each([
        ['sem nome', { nome: '  ', telefone: '', email: '' }],
        ['com telefone incompleto', { nome: 'Edu', telefone: '1234', email: '' }],
        ['com email inválido', { nome: 'Edu', telefone: '', email: 'edu@' }]
    ])('recusa cliente %s', async (_, cliente) => {
        const resposta = await api().post('/api/clientes').send(cliente);
        expect(resposta.status).toBe(400);
    });

    test('não exclui cliente que tem pets e explica o motivo', async () => {
        const { cliente } = await criarClienteComPet('Fabi');
        const resposta = await excluirCliente(cliente.id);

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toMatch(/1 pet/);
    });

    test('não exclui cliente que tem atendimentos no histórico', async () => {
        const { cliente, pet } = await criarClienteComPet('Gabi');
        const ids = await idsPorNome();
        await api().post('/api/atendimentos').send({
            cliente_id: cliente.id, animal_id: pet.id, servico_id: ids.servico('Banho'),
            profissional_id: ids.profissional('Rafaela Duarte'), data_atendimento: '2030-04-02', hora_atendimento: '09:00'
        });

        const resposta = await excluirCliente(cliente.id);

        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toMatch(/atendimento/);
    });

    test('exclui cliente sem pets nem atendimentos', async () => {
        const cliente = (await api().post('/api/clientes').send({ nome: 'Hugo', telefone: '', email: '' })).body;
        const resposta = await excluirCliente(cliente.id);

        expect(resposta.status).toBe(200);
    });
});

describe('Animais', () => {
    let dono;

    beforeAll(async () => {
        dono = (await api().post('/api/clientes').send({ nome: 'Iara', telefone: '', email: '' })).body;
    });

    test('cadastra com raça e idade opcionais', async () => {
        const resposta = await api().post('/api/animais').send({ nome: 'Bolt', especie: 'Cachorro', raca: '', idade: '', cliente_id: dono.id });

        expect(resposta.status).toBe(201);
        expect(resposta.body.raca).toBeNull();
        expect(resposta.body.idade).toBeNull();
    });

    test.each([
        ['sem espécie', { nome: 'Bolt', especie: '' }],
        ['com idade negativa', { nome: 'Bolt', especie: 'Gato', idade: -2 }],
        ['com idade quebrada', { nome: 'Bolt', especie: 'Gato', idade: 2.5 }],
        ['sem dono', { nome: 'Bolt', especie: 'Gato', cliente_id: null }],
        ['com dono que não existe', { nome: 'Bolt', especie: 'Gato', cliente_id: 999999 }]
    ])('recusa animal %s', async (_, animal) => {
        const resposta = await api().post('/api/animais').send({ cliente_id: dono.id, ...animal });
        expect(resposta.status).toBe(400);
    });
});

describe('Usuários', () => {
    test('não deixa cadastrar dois usuários com o mesmo email (nem mudando maiúsculas)', async () => {
        await request(app).post('/api/usuarios').send({ nome: 'João', email: 'joao@teste.com', senha: 'segredo123' });
        const repetido = await request(app).post('/api/usuarios').send({ nome: 'João 2', email: 'JOAO@teste.com', senha: 'segredo123' });

        expect(repetido.status).toBe(400);
        expect(repetido.body.erro).toMatch(/já existe/i);
    });

    test('recusa senha com menos de 6 caracteres', async () => {
        const resposta = await request(app).post('/api/usuarios').send({ nome: 'Lia', email: 'lia@teste.com', senha: '123' });
        expect(resposta.status).toBe(400);
    });

    test('login funciona com o email em maiúsculas', async () => {
        const resposta = await request(app).post('/api/login').send({ email: 'JOAO@TESTE.COM', senha: 'segredo123' });
        expect(resposta.status).toBe(200);
    });
});
