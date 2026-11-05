const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/autenticar');
const { listarVacinas, criarVacina, atualizarVacina, excluirVacina } = require('../controllers/vacinaController');

router.get('/vacinas', autenticar, listarVacinas);
router.post('/vacinas', autenticar, criarVacina);
router.put('/vacinas/:id', autenticar, atualizarVacina);
router.delete('/vacinas/:id', autenticar, excluirVacina);

module.exports = router;
