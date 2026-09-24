const express = require('express');
const router = express.Router();
const { criarAtendimento, listarAtendimentos, atualizarAtendimento } = require('../controllers/atendimentoController');
const autenticar = require('../middlewares/autenticar');

router.post('/atendimentos', autenticar, criarAtendimento);
router.get('/atendimentos', autenticar, listarAtendimentos);
router.put('/atendimentos/:id', autenticar, atualizarAtendimento);

module.exports = router;