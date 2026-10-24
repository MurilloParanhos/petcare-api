const pool = require('../src/config/db');
const { api } = require('./ajuda');

afterAll(() => pool.end());

describe('Catálogo de serviços', () => {
    test('lista os serviços iniciais com preço, duração e função', async () => {
        const resposta = await api().get('/api/servicos');

        expect(resposta.status).toBe(200);
        const banho = resposta.body.find((s) => s.nome === 'Banho');
        expect(banho).toMatchObject({ preco: '60.00', duracao_minutos: 60, funcao: 'tosador', ativo: true });
    });

    test('cadastra um serviço novo', async () => {
        const resposta = await api().post('/api/servicos')
            .send({ nome: 'Hidratação', preco: 45.5, duracao_minutos: 30, funcao: 'tosador' });

        expect(resposta.status).toBe(201);
        expect(resposta.body.preco).toBe('45.50');
    });

    test.each([
        ['sem preço', { nome: 'Sem preço', duracao_minutos: 30, funcao: 'tosador' }],
        ['preço negativo', { nome: 'Negativo', preco: -1, duracao_minutos: 30, funcao: 'tosador' }],
        ['duração zero', { nome: 'Sem duração', preco: 10, duracao_minutos: 0, funcao: 'tosador' }],
        ['função que não existe', { nome: 'Caixa', preco: 10, duracao_minutos: 30, funcao: 'caixa' }],
        ['nome repetido', { nome: 'Banho', preco: 10, duracao_minutos: 30, funcao: 'tosador' }]
    ])('recusa serviço %s', async (_, servico) => {
        const resposta = await api().post('/api/servicos').send(servico);
        expect(resposta.status).toBe(400);
    });
});
