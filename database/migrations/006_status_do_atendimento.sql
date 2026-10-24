-- Status do atendimento. Antes, "realizado" era deduzido so pela data;
-- agora fica registrado se o atendimento foi concluido, cancelado ou se
-- o cliente faltou. O faturamento passa a contar so os concluidos, e um
-- atendimento cancelado libera o horario na agenda.

ALTER TABLE atendimentos
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'agendado'
        CHECK (status IN ('agendado', 'concluido', 'cancelado', 'faltou'));

-- Os que ja passaram sao considerados concluidos; os futuros continuam agendados
UPDATE atendimentos SET status = 'concluido' WHERE data_atendimento < CURRENT_DATE;
