const express = require('express');
const router = express.Router();
const { criarCliente, listarClientes } = require('../controllers/clienteController');
const autenticar = require('../middlewares/autenticar');

router.post('/clientes', autenticar, criarCliente);
router.get('/clientes', autenticar, listarClientes);

module.exports = router;