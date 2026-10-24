const express = require('express');
const router = express.Router();
const autenticar = require('../middlewares/autenticar');
const { listarProfissionais } = require('../controllers/profissionalController');

router.get('/profissionais', autenticar, listarProfissionais);

module.exports = router;
