// Telas de alocações: listagem e formulário.
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('alocados/vwLstAlocados', {
    title: 'Alocações',
    showNavbar: true,
    activeMenu: 'alocados',
    servidorDw3: process.env.SERVIDOR_DW3 // É necessário, pois, o front em html não acesso ao arquivo .env
  });
});

// A operação vem em ?oper= (Cr, Re, Up, De).
router.get('/form', function(req, res) {
  res.render('alocados/vwFormAlocados', {
    title: 'Formulario de alocações',
    showNavbar: true,
    activeMenu: 'alocados',
    servidorDw3: process.env.SERVIDOR_DW3
  });
});

module.exports = router;
