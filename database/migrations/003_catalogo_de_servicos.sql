-- Catalogo de servicos com preco.
-- O atendimento passa a apontar para um servico e guarda o valor cobrado.
-- O valor fica no atendimento (e nao so no servico) para que um reajuste
-- de preco no futuro nao altere o faturamento dos meses que ja passaram.

CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO servicos (nome, preco) VALUES
    ('Banho', 60.00),
    ('Banho e Tosa', 90.00),
    ('Tosa higiênica', 40.00),
    ('Consulta veterinária', 150.00),
    ('Vacinação', 120.00);

ALTER TABLE atendimentos
    ADD COLUMN servico_id INTEGER REFERENCES servicos(id),
    ADD COLUMN valor NUMERIC(10, 2) CHECK (valor >= 0);

-- Liga os atendimentos antigos ao servico de mesmo nome, ignorando
-- maiusculas, espacos e acentos ("Consulta veterinaria" = "Consulta veterinária")
UPDATE atendimentos t
SET servico_id = s.id,
    tipo_servico = s.nome,
    valor = s.preco
FROM servicos s
WHERE translate(lower(trim(t.tipo_servico)), 'áàãâéêíóôõúç', 'aaaaeeiooouc')
    = translate(lower(s.nome), 'áàãâéêíóôõúç', 'aaaaeeiooouc');
