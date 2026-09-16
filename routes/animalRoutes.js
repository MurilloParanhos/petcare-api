const express = require('express');
const router = express.Router();
const { criarAnimal, listarAnimais } = require('../controllers/animalController');
const autenticar = require('../middlewares/autenticar');

router.post('/animais', autenticar, criarAnimal);
router.get('/animais', autenticar, listarAnimais);

module.exports = router;