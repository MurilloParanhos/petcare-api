const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/autenticar');
const { listarProfissionais, criarProfissional, atualizarProfissional } = require('../controllers/profissionalController');

router.get('/profissionais', autenticar, listarProfissionais);
router.post('/profissionais', autenticar, criarProfissional);
router.put('/profissionais/:id', autenticar, atualizarProfissional);

module.exports = router;
