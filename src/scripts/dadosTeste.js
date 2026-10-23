// Cria ou apaga dados ficticios para ver o dashboard cheio.
// Uso:
//   npm run dados-teste -- criar
//   npm run dados-teste -- limpar
//
// Os clientes criados aqui tem email @teste.petcare. A limpeza apaga esses
// clientes junto com os animais e atendimentos deles, e nada mais.

const pool = require('../config/db');

const DOMINIO_TESTE = '@teste.petcare';
// Marca usada em versoes antigas deste script; a limpeza ainda apaga quem tiver
const MARCA_TESTE = '[TESTE]';

const CLIENTES = [
    { nome: 'Ana Souza', telefone: '11987650001' },
    { nome: 'Carlos Lima', telefone: '11987650002' },
    { nome: 'Fernanda Rocha', telefone: '11987650003' },
    { nome: 'Rafael Mendes', telefone: '11987650004' },
    { nome: 'Juliana Alves', telefone: '11987650005' },
    { nome: 'Bruno Carvalho', telefone: '11987650006' },
    { nome: 'Patricia Gomes', telefone: '11987650007' },
    { nome: 'Lucas Ferreira', telefone: '11987650008' },
    { nome: 'Camila Ribeiro', telefone: '11987650009' },
    { nome: 'Diego Martins', telefone: '11987650010' },
    { nome: 'Beatriz Costa', telefone: '11987650011' },
    { nome: 'Thiago Barbosa', telefone: '11987650012' }
];

const ANIMAIS = [
    { nome: 'Thor', especie: 'Cachorro', raca: 'Golden Retriever', idade: 4 },
    { nome: 'Mel', especie: 'Cachorro', raca: 'Shih Tzu', idade: 6 },
    { nome: 'Luna', especie: 'Gato', raca: 'Siamês', idade: 3 },
    { nome: 'Bob', especie: 'Cachorro', raca: 'Vira-lata', idade: 8 },
    { nome: 'Nina', especie: 'Cachorro', raca: 'Poodle', idade: 5 },
    { nome: 'Simba', especie: 'Gato', raca: 'Persa', idade: 2 },
    { nome: 'Pipoca', especie: 'Cachorro', raca: 'Lhasa Apso', idade: 7 },
    { nome: 'Fred', especie: 'Cachorro', raca: 'Bulldog Francês', idade: 3 },
    { nome: 'Amora', especie: 'Gato', raca: 'Vira-lata', idade: 1 },
    { nome: 'Max', especie: 'Cachorro', raca: 'Labrador', idade: 9 },
    { nome: 'Belinha', especie: 'Cachorro', raca: 'Yorkshire', idade: 4 },
    { nome: 'Tom', especie: 'Gato', raca: 'Maine Coon', idade: 5 },
    { nome: 'Paçoca', especie: 'Cachorro', raca: 'Spitz Alemão', idade: 2 },
    { nome: 'Lola', especie: 'Cachorro', raca: 'Beagle', idade: 6 },
    { nome: 'Frajola', especie: 'Gato', raca: 'Vira-lata', idade: 10 },
    { nome: 'Zeus', especie: 'Cachorro', raca: 'Pastor Alemão', idade: 5 }
];

// Peso = chance relativa de cada servico aparecer
const SERVICOS = [
    { nome: 'Banho e Tosa', peso: 35 },
    { nome: 'Banho', peso: 22 },
    { nome: 'Consulta veterinaria', peso: 20 },
    { nome: 'Vacinação', peso: 13 },
    { nome: 'Tosa higiênica', peso: 10 }
];

// Observacoes de exemplo por servico. null = atendimento sem observacao
const OBSERVACOES = {
    'Banho e Tosa': [
        'Ficou lindo! Tutor adorou o resultado.',
        'Muito tranquilo durante a tosa, um amor.',
        'Tutor pediu tosa mais curta nas patas.',
        'Pelagem com alguns nós, foi feita desembolação.',
        'Saiu cheiroso e com lacinho. Tutor mandou foto agradecendo.',
        null
    ],
    'Banho': [
        'Usado shampoo hipoalergênico a pedido do tutor.',
        'Comportamento ótimo, já conhece a equipe.',
        'Ficou um pouco agitado com o secador, mas deu tudo certo.',
        'Unhas cortadas junto com o banho.',
        null
    ],
    'Consulta veterinaria': [
        'Check-up de rotina, tudo normal.',
        'Leve otite no ouvido direito. Receitado remédio por 7 dias.',
        'Peso ideal, tutor está de parabéns com a alimentação.',
        'Retorno em 30 dias para reavaliação.',
        'Exame de sangue solicitado, resultado sai em 3 dias.'
    ],
    'Vacinação': [
        'V10 aplicada. Próxima dose em 1 ano.',
        'Antirrábica aplicada, carteirinha atualizada.',
        'Vacina aplicada sem reações. Muito corajoso!',
        'Primeira dose aplicada, reforço em 21 dias.'
    ],
    'Tosa higiênica': [
        'Tosa higiênica feita com cuidado, ficou ótimo.',
        'Tutor elogiou o atendimento da equipe.',
        null
    ]
};

const OBSERVACOES_AGENDADO = [
    'Confirmar horário por WhatsApp no dia anterior.',
    'Tutor prefere atendimento pela manhã.',
    'Vai trazer a própria toalha.',
    'Tutor vai deixar cedo e buscar depois do almoço.',
    null
];

// Atendimentos em cada um dos ultimos 6 meses (do mais antigo ao atual),
// crescendo para o grafico mostrar uma tendencia
const ATENDIMENTOS_POR_MES = [6, 8, 9, 11, 14, 10];
const AGENDADOS = 6;

// Os 2 ultimos clientes so tem atendimento antigo, para aparecerem como inativos
const CLIENTES_INATIVOS = 2;

// Gerador de numeros aleatorios com semente: gera sempre os mesmos dados
let semente = 42;
function aleatorio() {
    semente = (semente * 16807) % 2147483647;
    return (semente - 1) / 2147483646;
}

function sortear(lista) {
    return lista[Math.floor(aleatorio() * lista.length)];
}

function sortearServico() {
    const total = SERVICOS.reduce((soma, s) => soma + s.peso, 0);
    let sorteio = aleatorio() * total;
    for (const servico of SERVICOS) {
        sorteio -= servico.peso;
        if (sorteio < 0) return servico.nome;
    }
    return SERVICOS[0].nome;
}

function formatarData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function emailDoCliente(nome) {
    const usuario = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.');
    return usuario + DOMINIO_TESTE;
}

async function criar() {
    const existentes = await pool.query('SELECT COUNT(*) FROM clientes WHERE email LIKE $1', ['%' + DOMINIO_TESTE]);
    if (Number(existentes.rows[0].count) > 0) {
        console.log('Ja existem dados de teste. Rode "limpar" antes de criar de novo.');
        return;
    }

    const conexao = await pool.connect();
    try {
        await conexao.query('BEGIN');

        const clienteIds = [];
        for (const cliente of CLIENTES) {
            const resultado = await conexao.query(
                'INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING id',
                [cliente.nome, cliente.telefone, emailDoCliente(cliente.nome)]
            );
            clienteIds.push(resultado.rows[0].id);
        }

        // Distribui os animais entre os clientes (alguns ficam com 2)
        const animaisPorCliente = {};
        for (let i = 0; i < ANIMAIS.length; i++) {
            const animal = ANIMAIS[i];
            const clienteId = clienteIds[i % clienteIds.length];
            const resultado = await conexao.query(
                'INSERT INTO animais (nome, especie, raca, idade, cliente_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [animal.nome, animal.especie, animal.raca, animal.idade, clienteId]
            );
            (animaisPorCliente[clienteId] ??= []).push(resultado.rows[0].id);
        }

        const ativos = clienteIds.slice(0, clienteIds.length - CLIENTES_INATIVOS);
        const inativos = clienteIds.slice(clienteIds.length - CLIENTES_INATIVOS);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        let totalAtendimentos = 0;

        // Cada atendimento vai para um dos animais do cliente, com uma
        // observacao combinando com o servico (ou com o agendamento)
        async function inserirAtendimento(clienteId, data, agendado = false) {
            const servico = sortearServico();
            const observacao = agendado ? sortear(OBSERVACOES_AGENDADO) : sortear(OBSERVACOES[servico]);

            await conexao.query(
                'INSERT INTO atendimentos (cliente_id, animal_id, tipo_servico, data_atendimento, observacoes) VALUES ($1, $2, $3, $4, $5)',
                [clienteId, sortear(animaisPorCliente[clienteId]), servico, formatarData(data), observacao]
            );
            totalAtendimentos++;
        }

        // Atendimentos ja realizados nos ultimos 6 meses
        for (let i = 0; i < ATENDIMENTOS_POR_MES.length; i++) {
            const mesesAtras = ATENDIMENTOS_POR_MES.length - 1 - i;
            const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, 1);
            const ultimoDia = mesesAtras === 0
                ? hoje.getDate() - 1
                : new Date(primeiroDia.getFullYear(), primeiroDia.getMonth() + 1, 0).getDate();

            for (let j = 0; j < ATENDIMENTOS_POR_MES[i]; j++) {
                const dia = 1 + Math.floor(aleatorio() * Math.max(ultimoDia, 1));
                const data = new Date(primeiroDia.getFullYear(), primeiroDia.getMonth(), dia);
                await inserirAtendimento(sortear(ativos), data);
            }
        }

        // Clientes inativos: um atendimento so, entre 4 e 5 meses atras
        for (const clienteId of inativos) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - 120 - Math.floor(aleatorio() * 30));
            await inserirAtendimento(clienteId, data);
        }

        // Agendados para as proximas 3 semanas
        for (let i = 0; i < AGENDADOS; i++) {
            const data = new Date(hoje);
            data.setDate(data.getDate() + 1 + Math.floor(aleatorio() * 21));
            await inserirAtendimento(sortear(ativos), data, true);
        }

        await conexao.query('COMMIT');
        console.log(`Criados: ${CLIENTES.length} clientes, ${ANIMAIS.length} animais e ${totalAtendimentos} atendimentos de teste.`);
    } catch (erro) {
        await conexao.query('ROLLBACK');
        throw erro;
    } finally {
        conexao.release();
    }
}

async function limpar() {
    const conexao = await pool.connect();
    try {
        await conexao.query('BEGIN');

        const filtroClientes = 'SELECT id FROM clientes WHERE email LIKE $1';
        const padrao = '%' + DOMINIO_TESTE;

        // Ordem importa: atendimentos e animais apontam para clientes
        const atendimentos = await conexao.query(
            `DELETE FROM atendimentos WHERE cliente_id IN (${filtroClientes}) OR observacoes LIKE $2`,
            [padrao, MARCA_TESTE + '%']
        );
        const animais = await conexao.query(`DELETE FROM animais WHERE cliente_id IN (${filtroClientes})`, [padrao]);
        const clientes = await conexao.query('DELETE FROM clientes WHERE email LIKE $1', [padrao]);

        await conexao.query('COMMIT');
        console.log(`Apagados: ${clientes.rowCount} clientes, ${animais.rowCount} animais e ${atendimentos.rowCount} atendimentos de teste.`);
    } catch (erro) {
        await conexao.query('ROLLBACK');
        throw erro;
    } finally {
        conexao.release();
    }
}

const comando = process.argv[2];
const acoes = { criar, limpar };

if (!acoes[comando]) {
    console.log('Uso: npm run dados-teste -- criar   (ou)   npm run dados-teste -- limpar');
    pool.end();
} else {
    acoes[comando]()
        .catch((erro) => console.error('Erro:', erro.message))
        .finally(() => pool.end());
}
