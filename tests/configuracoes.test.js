const pool = require('../src/config/db');
const { api, criarClienteComPet, idsPorNome } = require('./ajuda');

// Um sabado e uma quarta no futuro, para os testes nao dependerem do dia em que rodam
const SABADO = '2030-06-08';
const QUARTA = '2030-06-05';

let regrasOriginais;

beforeAll(async () => {
    regrasOriginais = (await api().get('/api/configuracoes/agenda')).body;
});

// Os outros arquivos de teste usam as regras padrao: devolve como estavam
afterAll(async () => {
    await api().put('/api/configuracoes/agenda').send(regrasOriginais);
    await pool.end();
});

function regras(dados = {}) {
    return { ...regrasOriginais, ...dados };
}

describe('Configurações da agenda', () => {
    test('começa com as regras padrão', () => {
        expect(regrasOriginais).toMatchObject({ abertura: '09:00', fechamento: '17:00', diasFechados: [0], intervaloMinutos: 30 });
    });

    test.each([
        ['abertura depois do fechamento', { abertura: '18:00' }],
        ['almoço fora do expediente', { almoco: { inicio: '08:00', fim: '09:00' } }],
        ['almoço que termina antes de começar', { almoco: { inicio: '13:00', fim: '12:00' } }],
        ['intervalo que não existe', { intervaloMinutos: 20 }],
        ['horário em formato errado', { abertura: '9h' }],
        ['todos os dias fechados', { diasFechados: [0, 1, 2, 3, 4, 5, 6] }]
    ])('recusa %s', async (_, dados) => {
        const resposta = await api().put('/api/configuracoes/agenda').send(regras(dados));
        expect(resposta.status).toBe(400);
    });

    test('a agenda passa a seguir as regras novas', async () => {
        const { cliente, pet } = await criarClienteComPet('Kiko');
        const ids = await idsPorNome();
        const banho = (dados) => api().post('/api/atendimentos').send({
            cliente_id: cliente.id, animal_id: pet.id, servico_id: ids.servico('Banho'),
            profissional_id: ids.profissional('Rafaela Duarte'), ...dados
        });

        // Fecha tambem aos sabados e passa a abrir as 08:00
        const salvo = await api().put('/api/configuracoes/agenda').send(regras({ abertura: '08:00', diasFechados: [0, 6] }));

        const noSabado = await banho({ data_atendimento: SABADO, hora_atendimento: '09:00' });
        const asOito = await banho({ data_atendimento: QUARTA, hora_atendimento: '08:00' });

        expect(salvo.status).toBe(200);
        expect(noSabado.status).toBe(400);
        expect(noSabado.body.erro).toMatch(/sábados/);
        expect(asOito.status).toBe(201);
    });
});
