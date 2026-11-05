const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/autenticar');
const { obterRegrasDaAgenda, atualizarRegrasDaAgenda } = require('../controllers/configuracaoController');

router.get('/configuracoes/agenda', autenticar, obterRegrasDaAgenda);
router.put('/configuracoes/agenda', autenticar, atualizarRegrasDaAgenda);

module.exports = router;
