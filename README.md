# PetCare API

Projeto de portfólio: uma API REST para cadastro de animais e clientes de uma clínica/pet shop, com sistema de login e autenticação.

## 📋 Sobre o projeto

Sistema back-end desenvolvido para praticar autenticação e modelagem de dados relacionais, simulando o cadastro de clientes e seus respectivos animais, com acesso restrito por login.

## 🚀 Tecnologias utilizadas

- Node.js
- Express
- PostgreSQL
- bcrypt (criptografia de senha)
- jsonwebtoken (JWT)
- dotenv

## ✅ Funcionalidades implementadas

- Cadastro de usuário com senha criptografada
- Login com geração de token JWT
- Middleware de autenticação (rotas protegidas por token)
- CRUD de clientes (criar e listar)
- Modelagem do banco de dados: `usuarios`, `clientes`, `animais`

## 🔜 Próximos passos

1. Completar o CRUD de Clientes (editar e excluir)
2. Criar o CRUD completo de Animais (criar, listar, editar, excluir)
3. Construir o front-end em HTML, CSS e JavaScript puro, consumindo essa API via `fetch` (tela de login + painel com clientes e animais)
4. Módulo de Consultas (agendamentos) — fase 2

## ⚙️ Como rodar o projeto localmente

1. Clone o repositório
2. Instale as dependências:

npm install

3. Crie um arquivo `.env` na raiz com as variáveis (veja `.env.example`)
4. Crie o banco de dados no PostgreSQL e rode os comandos SQL de criação das tabelas (`clientes`, `animais`, `usuarios`)
5. Inicie o servidor:

node server.js


## 📌 Endpoints

| Método | Rota            | Protegida? | Descrição                  |
|--------|-----------------|:----------:|-----------------------------|
| POST   | /api/usuarios   | Não        | Cadastra um novo usuário    |
| POST   | /api/login      | Não        | Faz login e retorna um token|
| POST   | /api/clientes   | Sim        | Cadastra um novo cliente    |
| GET    | /api/clientes   | Sim        | Lista todos os clientes     |

## 👤 Autor

Murillo Paranhos Machado
[LinkedIn](https://linkedin.com/in/murillo-paranhos-machado-19889815a) · [GitHub](https://github.com/MurilloParanhos)