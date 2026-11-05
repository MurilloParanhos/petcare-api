-- Carteira de vacinacao dos pets. Cada linha e uma dose aplicada; a
-- proxima_dose (opcional) e usada para avisar quando a vacina esta vencendo.
-- Se o pet for excluido, a carteira dele vai junto.

CREATE TABLE vacinas (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    data_aplicacao DATE NOT NULL,
    proxima_dose DATE CHECK (proxima_dose IS NULL OR proxima_dose > data_aplicacao),
    observacoes TEXT
);
