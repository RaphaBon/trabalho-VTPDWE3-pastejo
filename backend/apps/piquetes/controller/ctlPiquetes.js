// Controller de piquetes: chama o model e responde em JSON.
//-- arquivo apps/piquetes/controller/ctlPiquetes.js

const mdlPiquetes = require("../model/mdlPiquetes");

// Responde { status: "ok", registro }.
const GetAllPiquetes = (req, res) =>
  (async () => {
    let registro = await mdlPiquetes.GetAllPiquetes();
    res.json({ status: "ok", "registro": registro });
  })();

// ID vem da URL (req.params).
const GetPiqueteByID = (req, res) =>
  (async () => {
    const piqueteID = parseInt(req.params.piqueteid);
    let registro = await mdlPiquetes.GetPiqueteByID(piqueteID);


    res.json({ status: "ok", "registro": registro });
  })();

// Pastos para o select do formulário.
const GetPastosToPiquetes = (req, res) =>
  (async () => {
    let registro = await mdlPiquetes.GetPastosToPiquetes();
    res.json({ status: "ok", "registro": registro });
  })();

// Dados vêm do corpo; responde { status, linhasAfetadas }.
const InsertPiquete = (request, res) =>
  (async () => {
    //@ Atenção: aqui já começamos a utilizar a variável msg para retornar erros de banco de dados.
    const piqueteREG = request.body;
    let { msg, linhasAfetadas } = await mdlPiquetes.InsertPiquete(piqueteREG);
    res.json({ "status": msg, "linhasAfetadas": linhasAfetadas });
  })();

// ID pela URL, dados pelo corpo.
const UpdatePiquete = (request, res) =>
  (async () => {
    const piqueteID = parseInt(request.params.piqueteid);
    const piqueteREG = request.body;
    let { msg, linhasAfetadas } = await mdlPiquetes.UpdatePiquete(piqueteID, piqueteREG);
    res.json({ "status": msg, "linhasAfetadas": linhasAfetadas });
  })();

// Remove (soft delete) pelo ID da URL.
const DeletePiquete = (request, res) =>
  (async () => {
    const piqueteID = parseInt(request.params.piqueteid);
    let { msg, linhasAfetadas } = await mdlPiquetes.DeletePiquete(piqueteID);
    res.json({ "status": msg, "linhasAfetadas": linhasAfetadas });
  })();

module.exports = {
  GetAllPiquetes,
  GetPiqueteByID,
  GetPastosToPiquetes,
  InsertPiquete,
  UpdatePiquete,
  DeletePiquete
};
