const express = require('express');
const router = express.Router();
const { criarAtendimento, listarAtendimentos, atualizarAtendimento, atualizarStatus, listarClientesInativos } = require('../controllers/atendimentoController');
const autenticar = require('../middlewares/autenticar');

router.post('/atendimentos', autenticar, criarAtendimento);
router.get('/atendimentos', autenticar, listarAtendimentos);
router.get('/atendimentos/inativos', autenticar, listarClientesInativos);
router.put('/atendimentos/:id', autenticar, atualizarAtendimento);
router.patch('/atendimentos/:id/status', autenticar, atualizarStatus);

module.exports = router;
