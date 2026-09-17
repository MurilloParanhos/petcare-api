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
    window.location.href = 'login.html';
}

document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

let editandoClienteId = null;
let editandoAnimalId = null;

async function carregarClientes() {
    try {
        const resposta = await fetch('/api/clientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const clientes = await resposta.json();

        document.getElementById('totalClientes').textContent = clientes.length;

        const corpoTabela = document.querySelector('#tabelaClientes tbody');
        corpoTabela.innerHTML = '';

        const selectCliente = document.getElementById('animalCliente');
        selectCliente.innerHTML = '';

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

            const opcao = document.createElement('option');
            opcao.value = cliente.id;
            opcao.textContent = cliente.nome;
            selectCliente.appendChild(opcao);
        });

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
}

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

function editarAnimal(animal) {
    document.getElementById('animalNome').value = animal.nome;
    document.getElementById('animalEspecie').value = animal.especie;
    document.getElementById('animalRaca').value = animal.raca ?? '';
    document.getElementById('animalIdade').value = animal.idade ?? '';
    document.getElementById('animalCliente').value = animal.cliente_id;
    editandoAnimalId = animal.id;
    document.getElementById('btnSalvarAnimal').textContent = 'Salvar edição';
}

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

carregarClientes();
carregarAnimais();