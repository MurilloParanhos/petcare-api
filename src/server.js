const app = require('./app');

// Porta configuravel (servicos de hospedagem costumam definir a variavel PORT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
