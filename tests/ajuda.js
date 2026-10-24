// Funcoes usadas por varios arquivos de teste
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

// Token valido, igual ao que o login devolve
function token() {
    return jwt.sign({ id: 1, nome: 'Teste' }, process.env.JWT_SECRET, { expiresIn: '5m' });
}

// Requisicao ja autenticada: api().post('/api/...').send({...})
function api() {
    const agente = request(app);
    const comToken = (requisicao) => requisicao.set('Authorization', `Bearer ${token()}`);
    return {
        get: (url) => comToken(agente.get(url)),
        post: (url) => comToken(agente.post(url)),
        put: (url) => comToken(agente.put(url)),
        patch: (url) => comToken(agente.patch(url))
    };
}

// Cadastra um cliente com um pet e devolve os dois
async function criarClienteComPet(nome) {
    const cliente = (await api().post('/api/clientes').send({ nome, telefone: '11999990000', email: '' })).body;
    const pet = (await api().post('/api/animais').send({
        nome: `Pet de ${nome}`, especie: 'Cachorro', raca: 'Vira-lata', idade: 3, cliente_id: cliente.id
    })).body;
    return { cliente, pet };
}

// Busca no catalogo o id de um servico e de um profissional pelo nome
async function idsPorNome() {
    const servicos = (await api().get('/api/servicos')).body;
    const profissionais = (await api().get('/api/profissionais')).body;
    const servico = (nome) => servicos.find((s) => s.nome === nome).id;
    const profissional = (nome) => profissionais.find((p) => p.nome === nome).id;
    return { servico, profissional };
}

module.exports = { app, api, token, criarClienteComPet, idsPorNome };
