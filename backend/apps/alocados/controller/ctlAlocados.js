// Controller de alocados: chama o model e responde em JSON.
//-- arquivo apps/alocados/controller/ctlAlocados.js

const mdlAlocados = require("../model/mdlAlocados");

// Responde { status: "ok", registro }.
const GetAllAlocados = (req, res) =>
  (async () => {
    let registro = await mdlAlocados.GetAllAlocados();
    res.json({ status: "ok", "registro": registro });
  })();

// ID vem da URL (req.params).
const GetAlocadoByID = (req, res) =>
  (async () => {
    const alocadoID = parseInt(req.params.alocadoid);
    let registro = await mdlAlocados.GetAlocadoByID(alocadoID);


    res.json({ status: "ok", "registro": registro });
  })();

// Animais para o select do formulário.
const GetAnimaisToAlocados = (req, res) =>
  (async () => {
    let registro = await mdlAlocados.GetAnimaisToAlocados();
    res.json({ status: "ok", "registro": registro });
  })();

// Piquetes para o select do formulário.
const GetPiquetesToAlocados = (req, res) =>
  (async () => {
    let registro = await mdlAlocados.GetPiquetesToAlocados();
    res.json({ status: "ok", "registro": registro });
  })();

// Dados vêm do corpo; responde { status, linhasAfetadas }.
const InsertAlocado = (request, res) =>
  (async () => {
    //@ Atenção: aqui já começamos a utilizar a variável msg para retornar erros de banco de dados.
    const alocadoREG = request.body;
    let { msg, linhasAfetadas } = await mdlAlocados.InsertAlocado(alocadoREG);
    res.json({ "status": msg, "linhasAfetadas": linhasAfetadas });
  })();

// ID pela URL, dados pelo corpo.
const UpdateAlocado = (request, res) =>
  (async () => {
    const alocadoID = parseInt(request.params.alocadoid);
    const alocadoREG = request.body;
    let { msg, linhasAfetadas } = await mdlAlocados.UpdateAlocado(alocadoID, alocadoREG);
    res.json({ "status": msg, "linhasAfetadas": linhasAfetadas });
  })();

// Remove (soft delete) pelo ID da URL.
const DeleteAlocado = (request, res) =>
  (async () => {
    const alocadoID = parseInt(request.params.alocadoid);
    let { msg, linhasAfetadas } = await mdlAlocados.DeleteAlocado(alocadoID);
    res.json({ "status": msg, "linhasAfetadas": linhasAfetadas });
  })();

module.exports = {
  GetAllAlocados,
  GetAlocadoByID,
  GetAnimaisToAlocados,
  GetPiquetesToAlocados,
  InsertAlocado,
  UpdateAlocado,
  DeleteAlocado
};
