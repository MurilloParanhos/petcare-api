const express = require('express');
const router = express.Router();
const { criarCliente, listarClientes, atualizarCliente, deletarCliente, listarClienteComAnimais } = require('../controllers/clienteController');
const autenticar = require('../middlewares/autenticar');

router.post('/clientes', autenticar, criarCliente);
router.get('/clientes', autenticar, listarClientes);
router.put('/clientes/:id', autenticar, atualizarCliente);
router.delete('/clientes/:id', autenticar, deletarCliente);
router.get('/clientes/:id/animais', autenticar, listarClienteComAnimais);

module.exports = router;