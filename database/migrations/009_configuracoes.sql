-- Configuracoes editaveis pela tela. A primeira e a da agenda: horario de
-- funcionamento, almoco, intervalo entre horarios e dias fechados. Os valores
-- iniciais sao os mesmos de shared/regrasAgenda.json (usado como padrao).

CREATE TABLE configuracoes (
    chave VARCHAR(50) PRIMARY KEY,
    valor JSONB NOT NULL
);

INSERT INTO configuracoes (chave, valor) VALUES (
    'agenda',
    '{"abertura": "09:00", "fechamento": "17:00", "almoco": {"inicio": "12:00", "fim": "13:00"}, "diasFechados": [0], "intervaloMinutos": 30}'
);
