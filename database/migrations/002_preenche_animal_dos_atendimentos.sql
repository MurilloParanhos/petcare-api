-- Preenche o animal dos atendimentos antigos (criados antes da migration 001).
-- So altera quando o cliente tem exatamente um animal, porque ai nao ha duvida
-- de qual pet foi atendido. Os demais continuam sem animal para ajuste manual.

UPDATE atendimentos t
SET animal_id = (SELECT a.id FROM animais a WHERE a.cliente_id = t.cliente_id)
WHERE t.animal_id IS NULL
  AND (SELECT COUNT(*) FROM animais a WHERE a.cliente_id = t.cliente_id) = 1;
