// Telas de pastos: listagem e formulário.
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('pastos/vwLstPastos', {
    title: 'Pastos',
    showNavbar: true,
    activeMenu: 'pastos',
    servidorDw3: process.env.SERVIDOR_DW3 // É necessário, pois, o front em html não acesso ao arquivo .env
  });
});

// A operação vem em ?oper= (Cr, Re, Up, De).
router.get('/form', function(req, res) {
  res.render('pastos/vwFormPastos', {
    title: 'Formulario de pastos',
    showNavbar: true,
    activeMenu: 'pastos',
    servidorDw3: process.env.SERVIDOR_DW3
  });
});

module.exports = router;
