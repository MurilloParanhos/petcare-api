# PetCare

Projeto de portfólio: sistema de gestão para clínica veterinária e pet shop, com API REST em Node.js e painel administrativo em React.

## Sobre o projeto

O PetCare permite cadastrar clientes e seus animais, registrar e agendar atendimentos (banho, tosa, consultas, vacinas) e acompanhar o desempenho do negócio em um dashboard com indicadores e gráficos. O acesso é restrito por login com token JWT.

O projeto começou com o front-end em HTML, CSS e JavaScript puro e foi migrado para React, mantendo a mesma API.

## Telas

As imagens usam apenas dados fictícios, gerados pelo script `npm run dados-teste`.

**Dashboard**: indicadores, faturamento dos últimos 6 meses, serviços mais procurados e próximos atendimentos.

![Dashboard](docs/prints/dashboard.png)

**Agenda do dia**: uma coluna por profissional, blocos do tamanho de cada serviço, cores por status, faixa da semana e pausa para almoço.

![Agenda do dia](docs/prints/agenda.png)

**Atendimentos**: formulário com sugestão automática de horário e profissional, filtros por status e serviço e ações rápidas.

![Atendimentos](docs/prints/atendimentos.png)

<details>
<summary>Mais telas: login e catálogo de serviços</summary>

![Login](docs/prints/login.png)

![Serviços](docs/prints/servicos.png)

</details>

## Tecnologias

**Back-end**
- Node.js e Express
- PostgreSQL (driver `pg`)
- bcrypt (criptografia de senha)
- jsonwebtoken (autenticação JWT)
- dotenv
- Jest e Supertest (testes automatizados da API)

**Front-end**
- React
- Vite
- Recharts (gráficos)
- react-datepicker e date-fns (calendário em português)

## Funcionalidades

- Login com senha criptografada e token JWT (validade de 8 horas), com retorno automático ao login quando a sessão expira e opção de lembrar o usuário
- Validação dos dados também na API (não só no formulário), com mensagens claras
- Rotas da API protegidas por middleware de autenticação
- Catálogo de serviços com preço; serviços usados no histórico são desativados em vez de excluídos
- Valor cobrado gravado em cada atendimento, para que reajustes de preço não alterem o faturamento passado
- CRUD de clientes e de animais
- Cadastro, edição e agendamento de atendimentos, vinculados ao cliente e ao pet atendido
- Agenda das 09:00 às 17:00 por profissional (2 tosadores e 2 veterinários): cada serviço tem uma duração e é feito por uma função; o sistema sugere o primeiro horário livre e o profissional menos ocupado, e a API recusa horários que se sobrepõem na agenda do mesmo profissional
- Status do atendimento (agendado, concluído, cancelado, faltou) com botões rápidos; cancelar libera o horário e o faturamento conta só os concluídos
- Agenda do dia em grade, com uma coluna por profissional: blocos do tamanho da duração de cada serviço, faixa da semana com a quantidade de atendimentos por dia, legenda de cores, linha da hora atual e clique num horário livre para agendar
- Horário de funcionamento, pausa para almoço, intervalo entre horários e dias fechados editáveis na aba Configurações (padrão: 09:00 às 17:00, almoço das 12:00 às 13:00, fechado aos domingos), validados no formulário e na API
- Equipe: cadastro, edição e desativação de profissionais (quem tem atendimentos agendados não pode ser desativado) e desempenho do mês de cada um
- Vacinas: carteira de vacinação de cada pet e aviso das vacinas vencidas ou vencendo nos próximos 30 dias, com o telefone do dono
- Relatórios por período (mês, últimos 30 ou 90 dias, ano ou datas escolhidas): faturamento, ticket médio, taxa de faltas e cancelamentos, resultados por serviço e por profissional, clientes que mais gastaram e exportação para Excel (CSV)
- Ficha do cliente com total gasto, última visita, próximo agendamento, pets com a situação das vacinas e histórico completo
- Lista de clientes inativos (sem atendimento há mais de 60 dias), com atalho para agendar
- Dashboard com:
  - indicadores de clientes, animais, atendimentos no mês, faturamento do mês e clientes inativos
  - gráfico de faturamento dos últimos 6 meses
  - gráfico dos serviços mais procurados
  - lista dos próximos atendimentos
- Busca sem distinção de acentos, filtros e paginação nas listas

## Estrutura do projeto

```
├── database/
│   ├── schema.sql          # Criação das tabelas
│   └── migrations/         # Alterações em bancos já existentes
├── docs/prints/            # Imagens das telas usadas neste README
├── frontend/               # Aplicação React (Vite)
│   └── src/
│       ├── api.js          # fetch com token JWT
│       ├── agenda.js       # Regras da agenda (horários livres, almoço, domingo)
│       ├── utils.js        # Busca, paginação, telefone e moeda
│       ├── hooks/          # Lógica reaproveitável (formulário de atendimento)
│       ├── pages/          # Login e Dashboard
│       └── components/     # Abas e componentes reutilizáveis
├── public/                 # CSS e imagens
├── shared/
│   └── regrasAgenda.json   # Valores padrão do horário de funcionamento (os atuais ficam no banco)
├── src/                    # API Express
│   ├── config/             # Conexão com o banco
│   ├── controllers/
│   ├── middlewares/        # Autenticação
│   ├── routes/
│   ├── scripts/            # Utilitários de linha de comando
│   ├── app.js              # Monta o Express (usado pelo servidor e pelos testes)
│   └── server.js           # Abre a porta
└── tests/                  # Testes automatizados da API
```

## Testes

```
npm test
```

São 68 testes de integração (Jest e Supertest) que chamam a API de verdade e cobrem:

- autenticação: sem token, token falso, token vencido, cadastro e login;
- usuários: email único (sem diferenciar maiúsculas) e senha mínima;
- clientes e animais: validações e exclusão bloqueada com mensagem clara quando há pets ou atendimentos;
- catálogo de serviços: cadastro e validações (preço, duração, função, nome repetido);
- regras da agenda: horário ocupado, mesmo horário com outro profissional, profissional de outra função, fora do expediente, almoço e domingo;
- status: cancelar libera o horário, reabrir um cancelado cujo horário foi ocupado é recusado e não dá para concluir ou marcar falta antes do dia do atendimento;
- clientes inativos;
- equipe: cadastro, validações e bloqueio de desativação de quem tem atendimentos agendados;
- vacinas: cadastro, validações de datas e exclusão junto com o pet;
- configurações: validação das regras e agenda obedecendo às regras novas.

Os testes rodam em um schema separado do PostgreSQL (`testes_petcare`), recriado a partir do `database/schema.sql` a cada execução. Assim, eles nunca alteram os dados reais.

## Como rodar localmente

**Pré-requisitos:** Node.js 20 ou superior e PostgreSQL.

1. Clone o repositório e instale as dependências:

   ```
   git clone https://github.com/MurilloParanhos/petcare-api.git
   cd petcare-api
   npm install
   npm --prefix frontend install
   ```

2. Crie um banco no PostgreSQL e rode o arquivo `database/schema.sql` para criar as tabelas. Se o seu banco foi criado com uma versão anterior do projeto, rode os arquivos de `database/migrations/` em ordem.

3. Copie o `.env.example` para `.env` e preencha com os dados do seu banco e um `JWT_SECRET`.

4. Crie um usuário para acessar o sistema (não há tela de cadastro):

   ```
   curl -X POST http://localhost:3000/api/usuarios \
     -H "Content-Type: application/json" \
     -d '{"nome": "Admin", "email": "admin@exemplo.com", "senha": "suasenha"}'
   ```

   O servidor precisa estar rodando (passo 5).

5. Inicie o projeto:

   **Modo desenvolvimento** (com recarregamento automático), em dois terminais:

   ```
   npm start          # API em http://localhost:3000
   npm run front      # React em http://localhost:5173
   ```

   Acesse http://localhost:5173.

   **Modo produção:**

   ```
   npm run build
   npm start
   ```

   Acesse http://localhost:3000.

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia a API |
| `npm run front` | Inicia o React em modo desenvolvimento |
| `npm run build` | Gera a versão de produção do React em `frontend/dist` |
| `npm test` | Roda os testes automatizados da API |
| `npm run dados-teste -- criar` | Cria clientes, animais e atendimentos fictícios para popular o dashboard |
| `npm run dados-teste -- limpar` | Apaga somente os dados fictícios criados pelo comando acima |
| `npm run redefinir-senha -- email@exemplo.com` | Define uma nova senha para um usuário |

## Endpoints

Todas as rotas, exceto cadastro de usuário e login, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Protegida | Descrição |
|--------|------|:---------:|-----------|
| POST | `/api/usuarios` | Não | Cadastra um usuário |
| POST | `/api/login` | Não | Faz login e retorna o token |
| GET | `/api/clientes` | Sim | Lista os clientes |
| POST | `/api/clientes` | Sim | Cadastra um cliente |
| PUT | `/api/clientes/:id` | Sim | Atualiza um cliente |
| DELETE | `/api/clientes/:id` | Sim | Exclui um cliente |
| GET | `/api/clientes/:id/animais` | Sim | Lista um cliente com seus animais |
| GET | `/api/animais` | Sim | Lista os animais (aceita `?cliente_id=`) |
| POST | `/api/animais` | Sim | Cadastra um animal |
| PUT | `/api/animais/:id` | Sim | Atualiza um animal |
| DELETE | `/api/animais/:id` | Sim | Exclui um animal |
| GET | `/api/atendimentos` | Sim | Lista os atendimentos |
| POST | `/api/atendimentos` | Sim | Registra um atendimento (o `animal_id` precisa ser do cliente; sem `valor`, usa o preço do serviço) |
| PUT | `/api/atendimentos/:id` | Sim | Atualiza um atendimento |
| PATCH | `/api/atendimentos/:id/status` | Sim | Muda só o status (agendado, concluido, cancelado, faltou) |
| GET | `/api/atendimentos/inativos` | Sim | Lista clientes sem atendimento há mais de 60 dias |
| GET | `/api/servicos` | Sim | Lista o catálogo de serviços |
| GET | `/api/profissionais` | Sim | Lista a equipe (tosadores e veterinários) |
| POST | `/api/profissionais` | Sim | Cadastra um profissional |
| PUT | `/api/profissionais/:id` | Sim | Atualiza nome, função ou ativa/desativa um profissional |
| GET | `/api/vacinas` | Sim | Lista as vacinas (aceita `?animal_id=`) |
| POST | `/api/vacinas` | Sim | Registra uma dose |
| PUT | `/api/vacinas/:id` | Sim | Atualiza uma dose |
| DELETE | `/api/vacinas/:id` | Sim | Exclui uma dose |
| GET | `/api/configuracoes/agenda` | Sim | Horário de funcionamento, almoço, intervalo e dias fechados |
| PUT | `/api/configuracoes/agenda` | Sim | Atualiza essas regras |
| POST | `/api/servicos` | Sim | Cadastra um serviço |
| PUT | `/api/servicos/:id` | Sim | Atualiza nome, preço, duração ou ativa/desativa um serviço |
| GET | `/api/status` | Não | Verifica a conexão com o banco |

## Próximos passos

- Tela de cadastro de usuários e recuperação de senha por email
- Lembrete de vacinas e agendamentos por WhatsApp
- Versão para celular
- Filtros e paginação no back-end para grandes volumes de dados

## Autor

Murillo Paranhos Machado
[LinkedIn](https://linkedin.com/in/murillo-paranhos-machado-19889815a) · [GitHub](https://github.com/MurilloParanhos)
