const menuItens = document.querySelectorAll('.sidebar nav li');
const views = document.querySelectorAll('.view');

menuItens.forEach((item) => {
    item.addEventListener('click', () => {
        menuItens.forEach((i) => i.classList.remove('ativo'));
        item.classList.add('ativo');

        views.forEach((view) => {
            view.classList.toggle('hidden', view.id !== item.dataset.view);
        });
    });
});

const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/';
}

document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/';
});

let editandoClienteId = null;
let editandoAnimalId = null;
let editandoAtendimentoId = null;
let listaClientes = [];

function preencherSelectClientes(elementoSelect, clientes) {
    elementoSelect.innerHTML = '';
    clientes.forEach((cliente) => {
        const opcao = document.createElement('option');
        opcao.value = cliente.id;
        opcao.textContent = cliente.nome;
        elementoSelect.appendChild(opcao);
    });
}

async function carregarClientes() {
    try {
        const resposta = await fetch('/api/clientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const clientes = await resposta.json();
        listaClientes = clientes;

        document.getElementById('totalClientes').textContent = clientes.length;

        const corpoTabela = document.querySelector('#tabelaClientes tbody');
        corpoTabela.innerHTML = '';

        clientes.forEach((cliente) => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.telefone}</td>
                <td>${cliente.email}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-excluir">Excluir</button>
                </td>
            `;
            linha.querySelector('.btn-editar').addEventListener('click', () => editarCliente(cliente));
            linha.querySelector('.btn-excluir').addEventListener('click', () => excluirCliente(cliente.id));
            corpoTabela.appendChild(linha);
        });

        preencherSelectClientes(document.getElementById('animalCliente'), clientes);
        preencherSelectClientes(document.getElementById('atendimentoCliente'), clientes);

    } catch (erro) {
        console.error(erro);
    }
}

function editarCliente(cliente) {
    document.getElementById('clienteNome').value = cliente.nome;
    document.getElementById('clienteTelefone').value = cliente.telefone;
    document.getElementById('clienteEmail').value = cliente.email;
    editandoClienteId = cliente.id;
    document.getElementById('btnSalvarCliente').textContent = 'Salvar edição';
    document.getElementById('btnCancelarCliente').classList.remove('hidden');
}

document.getElementById('btnCancelarCliente').addEventListener('click', () => {
    document.getElementById('formCliente').reset();
    editandoClienteId = null;
    document.getElementById('btnSalvarCliente').textContent = 'Adicionar cliente';
    document.getElementById('btnCancelarCliente').classList.add('hidden');
});

async function excluirCliente(id) {
    if (!confirm('Tem certeza que quer excluir esse cliente?')) return;

    try {
        const resposta = await fetch(`/api/clientes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || 'Erro ao excluir cliente.');
            return;
        }

        carregarClientes();

    } catch (erro) {
        console.error(erro);
    }
}

async function carregarAnimais() {
    try {
        const resposta = await fetch('/api/animais', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const animais = await resposta.json();

        document.getElementById('totalAnimais').textContent = animais.length;

        const corpoTabela = document.querySelector('#tabelaAnimais tbody');
        corpoTabela.innerHTML = '';

        animais.forEach((animal) => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${animal.nome}</td>
                <td>${animal.especie}</td>
                <td>${animal.raca ?? '-'}</td>
                <td>${animal.idade ?? '-'}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-excluir">Excluir</button>
                </td>
            `;
            linha.querySelector('.btn-editar').addEventListener('click', () => editarAnimal(animal));
            linha.querySelector('.btn-excluir').addEventListener('click', () => excluirAnimal(animal.id));
            corpoTabela.appendChild(linha);
        });

    } catch (erro) {
        console.error(erro);
    }
}

async function carregarAtendimentos() {
    try {
        const resposta = await fetch('/api/atendimentos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const atendimentos = await resposta.json();

        const corpoTabela = document.querySelector('#tabelaAtendimentos tbody');
        corpoTabela.innerHTML = '';

        atendimentos.forEach((atendimento) => {
            const linha = document.createElement('tr');
            const dataFormatada = new Date(atendimento.data_atendimento).toLocaleDateString('pt-BR');

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataDoAtendimento = new Date(atendimento.data_atendimento);

            if (dataDoAtendimento < hoje) {
                linha.classList.add('atendimento-realizado');
            } else {
                linha.classList.add('atendimento-agendado');
            }

            linha.innerHTML = `
                <td>${listaClientes.find(c => c.id === atendimento.cliente_id)?.nome ?? 'Cliente #' + atendimento.cliente_id}</td>
                <td>${atendimento.tipo_servico}</td>
                <td>${dataFormatada}</td>
                <td>${atendimento.observacoes ?? '-'}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                </td>
            `;
            linha.querySelector('.btn-editar').addEventListener('click', () => editarAtendimento(atendimento));
            corpoTabela.appendChild(linha);
        });

    } catch (erro) {
        console.error(erro);
    }
}

function editarAtendimento(atendimento) {
    document.getElementById('atendimentoCliente').value = atendimento.cliente_id;
    document.getElementById('atendimentoServico').value = atendimento.tipo_servico;

    const data = new Date(atendimento.data_atendimento).toISOString().split('T')[0];
    document.getElementById('atendimentoData').value = data;

    document.getElementById('atendimentoObs').value = atendimento.observacoes ?? '';
    editandoAtendimentoId = atendimento.id;
    document.getElementById('btnSalvarAtendimento').textContent = 'Salvar edição';
    document.getElementById('btnCancelarAtendimento').classList.remove('hidden');
}

document.getElementById('btnCancelarAtendimento').addEventListener('click', () => {
    document.getElementById('formAtendimento').reset();
    editandoAtendimentoId = null;
    document.getElementById('btnSalvarAtendimento').textContent = 'Registrar atendimento';
    document.getElementById('btnCancelarAtendimento').classList.add('hidden');
});

function editarAnimal(animal) {
    document.getElementById('animalNome').value = animal.nome;
    document.getElementById('animalEspecie').value = animal.especie;
    document.getElementById('animalRaca').value = animal.raca ?? '';
    document.getElementById('animalIdade').value = animal.idade ?? '';
    document.getElementById('animalCliente').value = animal.cliente_id;
    editandoAnimalId = animal.id;
    document.getElementById('btnSalvarAnimal').textContent = 'Salvar edição';
    document.getElementById('btnCancelarAnimal').classList.remove('hidden');
}

document.getElementById('btnCancelarAnimal').addEventListener('click', () => {
    document.getElementById('formAnimal').reset();
    editandoAnimalId = null;
    document.getElementById('btnSalvarAnimal').textContent = 'Adicionar animal';
    document.getElementById('btnCancelarAnimal').classList.add('hidden');
});

async function excluirAnimal(id) {
    if (!confirm('Tem certeza que quer excluir esse animal?')) return;

    try {
        const resposta = await fetch(`/api/animais/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || 'Erro ao excluir animal.');
            return;
        }

        carregarAnimais();

    } catch (erro) {
        console.error(erro);
    }
}

document.getElementById('formCliente').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const msg = document.getElementById('msgCliente');
    msg.textContent = '';

    const nome = document.getElementById('clienteNome').value.trim();
    const telefone = document.getElementById('clienteTelefone').value.trim();
    const email = document.getElementById('clienteEmail').value.trim();

    if (!nome) {
        msg.textContent = 'Preencha o nome do cliente.';
        return;
    }

    const url = editandoClienteId ? `/api/clientes/${editandoClienteId}` : '/api/clientes';
    const method = editandoClienteId ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, telefone, email })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            msg.textContent = dados.erro || 'Erro ao salvar cliente.';
            return;
        }

        evento.target.reset();
        editandoClienteId = null;
        document.getElementById('btnSalvarCliente').textContent = 'Adicionar cliente';
        carregarClientes();

    } catch (erro) {
        console.error(erro);
        msg.textContent = 'Erro ao conectar com o servidor.';
    }
});

document.getElementById('formAnimal').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const msg = document.getElementById('msgAnimal');
    msg.textContent = '';

    const nome = document.getElementById('animalNome').value.trim();
    const especie = document.getElementById('animalEspecie').value.trim();
    const raca = document.getElementById('animalRaca').value.trim();
    const idade = document.getElementById('animalIdade').value;
    const cliente_id = document.getElementById('animalCliente').value;

    if (!nome || !especie) {
        msg.textContent = 'Preencha pelo menos nome e espécie.';
        return;
    }

    if (!cliente_id) {
        msg.textContent = 'Cadastre um cliente antes de adicionar um animal.';
        return;
    }

    const url = editandoAnimalId ? `/api/animais/${editandoAnimalId}` : '/api/animais';
    const method = editandoAnimalId ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, especie, raca, idade, cliente_id })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            msg.textContent = dados.erro || 'Erro ao salvar animal.';
            return;
        }

        evento.target.reset();
        editandoAnimalId = null;
        document.getElementById('btnSalvarAnimal').textContent = 'Adicionar animal';
        carregarAnimais();

    } catch (erro) {
        console.error(erro);
        msg.textContent = 'Erro ao conectar com o servidor.';
    }
});

document.getElementById('formAtendimento').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const msg = document.getElementById('msgAtendimento');
    msg.textContent = '';

    const cliente_id = document.getElementById('atendimentoCliente').value;
    const tipo_servico = document.getElementById('atendimentoServico').value.trim();
    const data_atendimento = document.getElementById('atendimentoData').value;
    const observacoes = document.getElementById('atendimentoObs').value.trim();

    if (!cliente_id || !tipo_servico || !data_atendimento) {
        msg.textContent = 'Preencha cliente, serviço e data.';
        return;
    }

    const url = editandoAtendimentoId ? `/api/atendimentos/${editandoAtendimentoId}` : '/api/atendimentos';
    const method = editandoAtendimentoId ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cliente_id, tipo_servico, data_atendimento, observacoes })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            msg.textContent = dados.erro || 'Erro ao salvar atendimento.';
            return;
        }

        evento.target.reset();
        editandoAtendimentoId = null;
        document.getElementById('btnSalvarAtendimento').textContent = 'Registrar atendimento';
        document.getElementById('btnCancelarAtendimento').classList.add('hidden');
        carregarAtendimentos();

    } catch (erro) {
        console.error(erro);
        msg.textContent = 'Erro ao conectar com o servidor.';
    }
});

carregarClientes();
carregarAnimais();
carregarAtendimentos();