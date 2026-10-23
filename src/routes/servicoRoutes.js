const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/autenticar');
const { listarServicos, criarServico, atualizarServico } = require('../controllers/servicoController');

router.get('/servicos', autenticar, listarServicos);
router.post('/servicos', autenticar, criarServico);
router.put('/servicos/:id', autenticar, atualizarServico);

module.exports = router;
