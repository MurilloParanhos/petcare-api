-- Impede dois usuarios com o mesmo email (ja aconteceu de um usuario ser
-- cadastrado duas vezes). Os emails passam a ser guardados em minusculas,
-- como a API ja faz no cadastro e no login.

UPDATE usuarios SET email = LOWER(TRIM(email));

ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_unico UNIQUE (email);
