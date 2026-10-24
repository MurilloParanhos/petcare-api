-- Profissionais do pet shop. A agenda passa a ser por profissional:
-- dois atendimentos no mesmo horario sao permitidos se forem com
-- profissionais diferentes. Cada servico indica qual funcao o realiza.

CREATE TABLE profissionais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    funcao VARCHAR(20) NOT NULL CHECK (funcao IN ('tosador', 'veterinario')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO profissionais (nome, funcao) VALUES
    ('Rafaela Duarte', 'tosador'),
    ('Marcos Vieira', 'tosador'),
    ('Dra. Helena Prado', 'veterinario'),
    ('Dr. Paulo Nogueira', 'veterinario');

ALTER TABLE servicos
    ADD COLUMN funcao VARCHAR(20) NOT NULL DEFAULT 'tosador' CHECK (funcao IN ('tosador', 'veterinario'));

UPDATE servicos SET funcao = 'veterinario' WHERE nome IN ('Consulta veterinária', 'Vacinação');

ALTER TABLE atendimentos
    ADD COLUMN profissional_id INTEGER REFERENCES profissionais(id);

-- Distribui os atendimentos existentes entre os dois profissionais de cada
-- funcao, alternando. Como antes so havia um atendimento por vez, nenhuma
-- distribuicao cria conflito de horario.
WITH atendimentos_numerados AS (
    SELECT a.id, s.funcao,
           ROW_NUMBER() OVER (PARTITION BY s.funcao ORDER BY a.id) - 1 AS posicao
    FROM atendimentos a
    JOIN servicos s ON s.id = a.servico_id
),
profissionais_numerados AS (
    SELECT id, funcao,
           ROW_NUMBER() OVER (PARTITION BY funcao ORDER BY id) - 1 AS posicao,
           COUNT(*) OVER (PARTITION BY funcao) AS total
    FROM profissionais
)
UPDATE atendimentos t
SET profissional_id = p.id
FROM atendimentos_numerados a
JOIN profissionais_numerados p
    ON p.funcao = a.funcao
   AND p.posicao = a.posicao % p.total
WHERE a.id = t.id;
