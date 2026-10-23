-- Liga cada atendimento ao animal atendido.
-- Fica opcional porque os atendimentos antigos nao tem animal.
-- Se o animal for excluido, o atendimento continua no historico sem o vinculo.

ALTER TABLE atendimentos
    ADD COLUMN animal_id INTEGER REFERENCES animais(id) ON DELETE SET NULL;
