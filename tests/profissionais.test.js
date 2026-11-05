const pool = require('../src/config/db');
const { api, criarClienteComPet, idsPorNome } = require('./ajuda');

afterAll(() => pool.end());

describe('Equipe', () => {
    test('cadastra um profissional novo, ativo por padrão', async () => {
        const resposta = await api().post('/api/profissionais').send({ nome: 'Bia Tosadora', funcao: 'tosador' });

        expect(resposta.status).toBe(201);
        expect(resposta.body).toMatchObject({ nome: 'Bia Tosadora', funcao: 'tosador', ativo: true });
    });

    test.each([
        ['sem nome', { nome: ' ', funcao: 'tosador' }],
        ['com função que não existe', { nome: 'Caio', funcao: 'caixa' }]
    ])('recusa profissional %s', async (_, profissional) => {
        const resposta = await api().post('/api/profissionais').send(profissional);
        expect(resposta.status).toBe(400);
    });

    test('desativa quem não tem atendimentos agendados', async () => {
        const novo = (await api().post('/api/profissionais').send({ nome: 'Dani Vet', funcao: 'veterinario' })).body;

        const resposta = await api().put(`/api/profissionais/${novo.id}`).send({ nome: 'Dani Vet', funcao: 'veterinario', ativo: false });

        expect(resposta.status).toBe(200);
        expect(resposta.body.ativo).toBe(false);
    });

    test('não desativa nem troca a função de quem tem atendimentos agendados', async () => {
        const novo = (await api().post('/api/profissionais').send({ nome: 'Edu Tosador', funcao: 'tosador' })).body;
        const { cliente, pet } = await criarClienteComPet('Fran');
        const ids = await idsPorNome();
        await api().post('/api/atendimentos').send({
            cliente_id: cliente.id, animal_id: pet.id, servico_id: ids.servico('Banho'),
            profissional_id: novo.id, data_atendimento: '2030-05-07', hora_atendimento: '09:00'
        });

        const desativar = await api().put(`/api/profissionais/${novo.id}`).send({ nome: 'Edu Tosador', funcao: 'tosador', ativo: false });
        const trocarFuncao = await api().put(`/api/profissionais/${novo.id}`).send({ nome: 'Edu Tosador', funcao: 'veterinario', ativo: true });
        const soRenomear = await api().put(`/api/profissionais/${novo.id}`).send({ nome: 'Eduardo Tosador', funcao: 'tosador', ativo: true });

        expect(desativar.status).toBe(400);
        expect(desativar.body.erro).toMatch(/1 atendimento/);
        expect(trocarFuncao.status).toBe(400);
        expect(soRenomear.status).toBe(200);
    });

    test('profissional desativado não recebe atendimento novo', async () => {
        const inativo = (await api().post('/api/profissionais').send({ nome: 'Gil Tosador', funcao: 'tosador' })).body;
        await api().put(`/api/profissionais/${inativo.id}`).send({ nome: 'Gil Tosador', funcao: 'tosador', ativo: false });
        const { cliente, pet } = await criarClienteComPet('Hana');
        const ids = await idsPorNome();

        const resposta = await api().post('/api/atendimentos').send({
            cliente_id: cliente.id, animal_id: pet.id, servico_id: ids.servico('Banho'),
            profissional_id: inativo.id, data_atendimento: '2030-05-07', hora_atendimento: '10:00'
        });

        expect(resposta.status).toBe(400);
    });
});
