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

CREATE TABLE atendimentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL,
    tipo_servico VARCHAR(100) NOT NULL,
    data_atendimento DATE NOT NULL,
    observacoes TEXT
);
