// Controller de pastos: chama o model e responde em JSON.
const mdlPastos = require("../model/mdlPastos");

// Responde { status: "ok", registro }.
const GetAllPastos = (req, res) =>
  (async () => {
    let registro = await mdlPastos.GetAllPastos();
    res.json({ status: "ok", registro: registro });
  })();

// ID vem da URL (req.params).
const GetPastoByID = (req, res) =>
  (async () => {
    const pastoID = parseInt(req.params.pastoid);
    let registro = await mdlPastos.GetPastoByID(pastoID);

    res.json({ status: "ok", registro: registro });
  })();

// Dados vêm do corpo; responde { status, linhasAfetadas }.
const InsertPasto = (request, res) =>
  (async () => {
    const registro = request.body;
    let { msg, linhasAfetadas } = await mdlPastos.InsertPasto(registro);
    res.json({ status: msg, linhasAfetadas: linhasAfetadas });
  })();

// ID pela URL, dados pelo corpo.
const UpdatePasto = (request, res) =>
  (async () => {
    const pastoID = parseInt(request.params.pastoid);
    const registro = request.body;
    let { msg, linhasAfetadas } = await mdlPastos.UpdatePasto(pastoID, registro);
    res.json({ status: msg, linhasAfetadas: linhasAfetadas });
  })();

// Remove (soft delete) pelo ID da URL.
const DeletePasto = (request, res) =>
  (async () => {
    const pastoID = parseInt(request.params.pastoid);
    let { msg, linhasAfetadas } = await mdlPastos.DeletePasto(pastoID);
    res.json({ status: msg, linhasAfetadas: linhasAfetadas });
  })();

module.exports = {
  GetAllPastos,
  GetPastoByID,
  InsertPasto,
  UpdatePasto,
  DeletePasto
};
