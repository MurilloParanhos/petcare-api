const express = require('express');
const router = express.Router();
const { criarAnimal, listarAnimais, atualizarAnimais, deletarAnimais } = require('../controllers/animalController');
const autenticar = require('../middlewares/autenticar');

router.post('/animais', autenticar, criarAnimal);
router.get('/animais', autenticar, listarAnimais);
router.put('/animais/:id', autenticar, atualizarAnimais);
router.delete('/animais/:id', autenticar, deletarAnimais);

module.exports = router;