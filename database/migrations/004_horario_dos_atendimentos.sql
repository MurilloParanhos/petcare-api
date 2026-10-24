-- Horario dos atendimentos (funcionamento das 09:00 as 17:00).
-- Cada servico tem uma duracao, usada para calcular o fim do atendimento
-- e nao deixar dois atendimentos no mesmo horario.

ALTER TABLE servicos
    ADD COLUMN duracao_minutos INTEGER NOT NULL DEFAULT 60 CHECK (duracao_minutos > 0);

UPDATE servicos SET duracao_minutos = 60 WHERE nome = 'Banho';
UPDATE servicos SET duracao_minutos = 90 WHERE nome = 'Banho e Tosa';
UPDATE servicos SET duracao_minutos = 30 WHERE nome IN ('Tosa higiênica', 'Consulta veterinária', 'Vacinação');

ALTER TABLE atendimentos
    ADD COLUMN hora_atendimento TIME;

-- Distribui os atendimentos que ja existem ao longo do dia: o primeiro as
-- 09:00 e cada um dos seguintes comeca quando o anterior termina
UPDATE atendimentos t
SET hora_atendimento = horarios.hora
FROM (
    SELECT a.id,
           TIME '09:00' + make_interval(mins => COALESCE(
               SUM(s.duracao_minutos) OVER (
                   PARTITION BY a.data_atendimento
                   ORDER BY a.id
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
               ), 0)::int) AS hora
    FROM atendimentos a
    JOIN servicos s ON s.id = a.servico_id
) AS horarios
WHERE horarios.id = t.id;
