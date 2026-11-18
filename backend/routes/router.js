// Rotas da API: URL -> função do controller.
//-- Arquiv routes/router.js

const express = require("express");
const routerApp = express.Router();

const appPastos = require("../apps/pastos/controller/ctlPastos");
const appAnimais = require("../apps/animais/controller/ctlAnimais");
const appPiquetes = require("../apps/piquetes/controller/ctlPiquetes");
const appAlocados = require("../apps/alocados/controller/ctlAlocados");
const appLogin = require("../apps/login/controller/ctlLogin");

routerApp.use((req, res, next) => {
  next();
});

routerApp.get("/", (req, res) => {
  res.send("Olá mundo!");
});

//Rotas de Pastos
// AutenticaJWT confere o token antes de chamar o controller.
routerApp.get("/getAllPastos", appLogin.AutenticaJWT, appPastos.GetAllPastos);
routerApp.get("/getPastoByID/:pastoid", appLogin.AutenticaJWT, appPastos.GetPastoByID);
routerApp.post("/insertPasto", appLogin.AutenticaJWT, appPastos.InsertPasto);
routerApp.put("/updatePasto/:pastoid", appLogin.AutenticaJWT, appPastos.UpdatePasto);
routerApp.delete("/deletePasto/:pastoid", appLogin.AutenticaJWT, appPastos.DeletePasto);

//Rotas de Animais
routerApp.get("/getAllAnimais", appLogin.AutenticaJWT, appAnimais.GetAllAnimais);
routerApp.get("/getAnimalByID/:animalid", appLogin.AutenticaJWT, appAnimais.GetAnimalByID);
routerApp.post("/insertAnimal", appLogin.AutenticaJWT, appAnimais.InsertAnimal);
routerApp.put("/updateAnimal/:animalid", appLogin.AutenticaJWT, appAnimais.UpdateAnimal);
routerApp.delete("/deleteAnimal/:animalid", appLogin.AutenticaJWT, appAnimais.DeleteAnimal);

//Rotas de Piquetes
routerApp.get("/getAllPiquetes", appLogin.AutenticaJWT, appPiquetes.GetAllPiquetes);
routerApp.get("/getPiqueteByID/:piqueteid", appLogin.AutenticaJWT, appPiquetes.GetPiqueteByID);
// Pastos para o Select2 do formulário de piquetes.
routerApp.get("/getPastosToPiquetes", appLogin.AutenticaJWT, appPiquetes.GetPastosToPiquetes);
routerApp.post("/insertPiquete", appLogin.AutenticaJWT, appPiquetes.InsertPiquete);
routerApp.put("/updatePiquete/:piqueteid", appLogin.AutenticaJWT, appPiquetes.UpdatePiquete);
routerApp.delete("/deletePiquete/:piqueteid", appLogin.AutenticaJWT, appPiquetes.DeletePiquete);

//Rotas de Alocados
routerApp.get("/getAllAlocados", appLogin.AutenticaJWT, appAlocados.GetAllAlocados);
routerApp.get("/getAlocadoByID/:alocadoid", appLogin.AutenticaJWT, appAlocados.GetAlocadoByID);
// Animais e piquetes para os dois Select2 do formulário de alocações.
routerApp.get("/getAnimaisToAlocados", appLogin.AutenticaJWT, appAlocados.GetAnimaisToAlocados);
routerApp.get("/getPiquetesToAlocados", appLogin.AutenticaJWT, appAlocados.GetPiquetesToAlocados);
routerApp.post("/insertAlocado", appLogin.AutenticaJWT, appAlocados.InsertAlocado);
routerApp.put("/updateAlocado/:alocadoid", appLogin.AutenticaJWT, appAlocados.UpdateAlocado);
routerApp.delete("/deleteAlocado/:alocadoid", appLogin.AutenticaJWT, appAlocados.DeleteAlocado);

// Rota Login
// Login e Logout ficam sem token.
routerApp.post("/Login", appLogin.Login);
routerApp.post("/Logout", appLogin.Logout);

module.exports = routerApp;
