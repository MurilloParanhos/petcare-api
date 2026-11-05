const request = require('supertest');
const pool = require('../src/config/db');
const { app, api, token, criarClienteComPet } = require('./ajuda');

let pet;

beforeAll(async () => {
    pet = (await criarClienteComPet('Ivo')).pet;
});

afterAll(() => pool.end());

function vacina(dados = {}) {
    return { animal_id: pet.id, nome: 'V10', data_aplicacao: '2026-01-10', proxima_dose: '2027-01-10', ...dados };
}

describe('Vacinas', () => {
    test('registra uma dose e lista pela carteira do pet', async () => {
        const criada = await api().post('/api/vacinas').send(vacina());
        const carteira = await api().get(`/api/vacinas?animal_id=${pet.id}`);

        expect(criada.status).toBe(201);
        expect(carteira.body.map((v) => v.id)).toContain(criada.body.id);
    });

    test('próxima dose é opcional', async () => {
        const resposta = await api().post('/api/vacinas').send(vacina({ nome: 'Giárdia', proxima_dose: '' }));
        expect(resposta.status).toBe(201);
        expect(resposta.body.proxima_dose).toBeNull();
    });

    test.each([
        ['sem nome', { nome: ' ' }],
        ['aplicada no futuro', { data_aplicacao: '2099-01-01', proxima_dose: '2099-06-01' }],
        ['com próxima dose antes da aplicação', { proxima_dose: '2025-12-01' }],
        ['com data em formato errado', { data_aplicacao: '10/01/2026' }],
        ['para pet que não existe', { animal_id: 999999 }]
    ])('recusa vacina %s', async (_, dados) => {
        const resposta = await api().post('/api/vacinas').send(vacina(dados));
        expect(resposta.status).toBe(400);
    });

    test('edita e exclui uma dose', async () => {
        const criada = (await api().post('/api/vacinas').send(vacina({ nome: 'Antirrábica' }))).body;

        const editada = await api().put(`/api/vacinas/${criada.id}`).send(vacina({ nome: 'Antirrábica', observacoes: 'Lote 123' }));
        const excluida = await request(app).delete(`/api/vacinas/${criada.id}`).set('Authorization', `Bearer ${token()}`);

        expect(editada.status).toBe(200);
        expect(editada.body.observacoes).toBe('Lote 123');
        expect(excluida.status).toBe(200);
    });

    test('excluir o pet apaga a carteira dele junto', async () => {
        const outro = (await criarClienteComPet('Juca')).pet;
        await api().post('/api/vacinas').send(vacina({ animal_id: outro.id }));

        await request(app).delete(`/api/animais/${outro.id}`).set('Authorization', `Bearer ${token()}`);
        const carteira = await api().get(`/api/vacinas?animal_id=${outro.id}`);

        expect(carteira.body).toHaveLength(0);
    });
});
