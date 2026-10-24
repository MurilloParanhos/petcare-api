const pool = require('../src/config/db');
const { api, criarClienteComPet, idsPorNome } = require('./ajuda');

// Datas fixas no futuro, para os testes nao dependerem do dia em que rodam
const SEGUNDA = '2030-03-04';
const TERCA = '2030-03-05';
const DOMINGO = '2030-03-10';
const PASSADO = '2025-01-06';

let ana;
let bruno;
let ids;

beforeAll(async () => {
    ana = await criarClienteComPet('Ana');
    bruno = await criarClienteComPet('Bruno');
    ids = await idsPorNome();
});

afterAll(() => pool.end());

// Monta um atendimento valido; cada teste troca so o que importa para ele
function atendimento(dados = {}) {
    return {
        cliente_id: ana.cliente.id,
        animal_id: ana.pet.id,
        servico_id: ids.servico('Banho'),
        profissional_id: ids.profissional('Rafaela Duarte'),
        data_atendimento: SEGUNDA,
        hora_atendimento: '09:00',
        ...dados
    };
}

function agendar(dados) {
    return api().post('/api/atendimentos').send(atendimento(dados));
}

describe('Cadastro de atendimento', () => {
    test('sem valor informado, cobra o preço do catálogo', async () => {
        const resposta = await agendar({ data_atendimento: TERCA, hora_atendimento: '15:00' });

        expect(resposta.status).toBe(201);
        expect(resposta.body.valor).toBe('60.00');
        expect(resposta.body.tipo_servico).toBe('Banho');
    });

    test('data futura entra como agendado e data passada como concluído', async () => {
        const futuro = await agendar({ data_atendimento: TERCA, hora_atendimento: '16:00' });
        const passado = await agendar({ data_atendimento: PASSADO, hora_atendimento: '09:00' });

        expect(futuro.body.status).toBe('agendado');
        expect(passado.body.status).toBe('concluido');
    });

    test('recusa pet que é de outro cliente', async () => {
        const resposta = await agendar({ animal_id: bruno.pet.id, data_atendimento: TERCA, hora_atendimento: '09:00' });
        expect(resposta.status).toBe(400);
    });

    test('recusa atendimento sem profissional', async () => {
        const resposta = await agendar({ profissional_id: undefined, data_atendimento: TERCA });
        expect(resposta.status).toBe(400);
    });
});

describe('Regras da agenda', () => {
    test('recusa horário ocupado na agenda do mesmo profissional', async () => {
        const primeiro = await agendar({ hora_atendimento: '09:00' });
        // Banho dura 60 min: 09:30 encavala com o das 09:00
        const encavalado = await agendar({ cliente_id: bruno.cliente.id, animal_id: bruno.pet.id, hora_atendimento: '09:30' });

        expect(primeiro.status).toBe(201);
        expect(encavalado.status).toBe(400);
        expect(encavalado.body.erro).toMatch(/Horário ocupado/);
    });

    test('aceita o mesmo horário com outro profissional', async () => {
        const resposta = await agendar({
            cliente_id: bruno.cliente.id,
            animal_id: bruno.pet.id,
            profissional_id: ids.profissional('Marcos Vieira'),
            hora_atendimento: '09:00'
        });
        expect(resposta.status).toBe(201);
    });

    test('aceita começar exatamente quando o anterior termina', async () => {
        const resposta = await agendar({ hora_atendimento: '10:00' });
        expect(resposta.status).toBe(201);
    });

    test('recusa profissional de outra função', async () => {
        const resposta = await agendar({ profissional_id: ids.profissional('Dra. Helena Prado'), hora_atendimento: '14:00' });
        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toMatch(/não realiza Banho/);
    });

    test.each([
        ['antes de abrir', '08:30'],
        ['terminando depois das 17:00', '16:30']
    ])('recusa horário %s', async (_, hora) => {
        const resposta = await agendar({ hora_atendimento: hora });
        expect(resposta.status).toBe(400);
    });

    test('recusa atendimento que pega o almoço', async () => {
        // Banho de 60 min às 11:30 terminaria 12:30
        const resposta = await agendar({ hora_atendimento: '11:30' });
        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toMatch(/almoço/);
    });

    test('recusa domingo', async () => {
        const resposta = await agendar({ data_atendimento: DOMINGO });
        expect(resposta.status).toBe(400);
        expect(resposta.body.erro).toMatch(/domingos/);
    });

    test('ao editar, o atendimento não conflita consigo mesmo', async () => {
        const criado = (await agendar({ data_atendimento: TERCA, hora_atendimento: '13:00' })).body;

        const resposta = await api().put(`/api/atendimentos/${criado.id}`)
            .send(atendimento({ data_atendimento: TERCA, hora_atendimento: '13:00', observacoes: 'Editado' }));

        expect(resposta.status).toBe(200);
        expect(resposta.body.observacoes).toBe('Editado');
    });
});

describe('Status do atendimento', () => {
    test('cancelar libera o horário, e reabrir com o horário ocupado é recusado', async () => {
        const original = (await agendar({ data_atendimento: TERCA, hora_atendimento: '10:00' })).body;

        const cancelado = await api().patch(`/api/atendimentos/${original.id}/status`).send({ status: 'cancelado' });
        const noLugar = await agendar({ cliente_id: bruno.cliente.id, animal_id: bruno.pet.id, data_atendimento: TERCA, hora_atendimento: '10:00' });
        const reaberto = await api().patch(`/api/atendimentos/${original.id}/status`).send({ status: 'agendado' });

        expect(cancelado.status).toBe(200);
        expect(noLugar.status).toBe(201);
        expect(reaberto.status).toBe(400);
    });

    test('recusa status que não existe', async () => {
        const criado = (await agendar({ data_atendimento: TERCA, hora_atendimento: '14:00' })).body;
        const resposta = await api().patch(`/api/atendimentos/${criado.id}/status`).send({ status: 'perdido' });
        expect(resposta.status).toBe(400);
    });
});

describe('Clientes inativos', () => {
    test('cliente sem visita nos últimos 60 dias aparece; cancelamento não conta como visita', async () => {
        const { cliente, pet } = await criarClienteComPet('Carla');
        const cancelado = (await agendar({
            cliente_id: cliente.id, animal_id: pet.id, data_atendimento: TERCA, hora_atendimento: '11:00'
        })).body;
        await api().patch(`/api/atendimentos/${cancelado.id}/status`).send({ status: 'cancelado' });

        const inativos = (await api().get('/api/atendimentos/inativos')).body.map((c) => c.id);
        expect(inativos).toContain(cliente.id);
        // A Ana tem atendimento agendado, entao nao esta inativa
        expect(inativos).not.toContain(ana.cliente.id);
    });
});
