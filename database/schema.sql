-- Estrutura do banco do PetCare (PostgreSQL)

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE animais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(50),
    idade INTEGER,
    cliente_id INTEGER REFERENCES clientes(id)
);

CREATE TABLE profissionais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    funcao VARCHAR(20) NOT NULL CHECK (funcao IN ('tosador', 'veterinario')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    duracao_minutos INTEGER NOT NULL DEFAULT 60 CHECK (duracao_minutos > 0),
    funcao VARCHAR(20) NOT NULL DEFAULT 'tosador' CHECK (funcao IN ('tosador', 'veterinario'))
);

-- tipo_servico guarda o nome do servico no momento do atendimento e
-- valor guarda o preco cobrado, para o historico nao mudar com reajustes
CREATE TABLE atendimentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
    servico_id INTEGER REFERENCES servicos(id),
    profissional_id INTEGER REFERENCES profissionais(id),
    tipo_servico VARCHAR(100) NOT NULL,
    valor NUMERIC(10, 2) CHECK (valor >= 0),
    data_atendimento DATE NOT NULL,
    hora_atendimento TIME,
    observacoes TEXT
);

INSERT INTO profissionais (nome, funcao) VALUES
    ('Rafaela Duarte', 'tosador'),
    ('Marcos Vieira', 'tosador'),
    ('Dra. Helena Prado', 'veterinario'),
    ('Dr. Paulo Nogueira', 'veterinario');

INSERT INTO servicos (nome, preco, duracao_minutos, funcao) VALUES
    ('Banho', 60.00, 60, 'tosador'),
    ('Banho e Tosa', 90.00, 90, 'tosador'),
    ('Tosa higiênica', 40.00, 30, 'tosador'),
    ('Consulta veterinária', 150.00, 30, 'veterinario'),
    ('Vacinação', 120.00, 30, 'veterinario');
