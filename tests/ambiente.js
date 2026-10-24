// Os testes usam um schema proprio do PostgreSQL, recriado a cada execucao.
// Assim eles nunca leem nem apagam os dados reais do sistema.
process.env.DB_SCHEMA = 'testes_petcare';
