-- Extras: nome do responsável desnormalizado (para exibição sem join com o diretório).
ALTER TABLE tickets.tickets ADD COLUMN IF NOT EXISTS responsavel_nome text;
