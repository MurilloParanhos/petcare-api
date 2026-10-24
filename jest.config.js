module.exports = {
    testEnvironment: 'node',
    // Recria o schema de testes antes de rodar (uma vez so)
    globalSetup: './tests/preparar.js',
    // Aponta a conexao com o banco para o schema de testes
    setupFiles: ['./tests/ambiente.js']
};
