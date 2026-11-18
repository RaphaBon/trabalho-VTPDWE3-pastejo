// Controller de animais: chama o model e responde em JSON.
const mdlAnimais = require("../model/mdlAnimais");

// Responde { status: "ok", registro }.
const GetAllAnimais = (req, res) =>
  (async () => {
    let registro = await mdlAnimais.GetAllAnimais();
    res.json({ status: "ok", registro: registro });
  })();

// ID vem da URL (req.params).
const GetAnimalByID = (req, res) =>
  (async () => {
    const animalID = parseInt(req.params.animalid);
    let registro = await mdlAnimais.GetAnimalByID(animalID);

    res.json({ status: "ok", registro: registro });
  })();

// Dados vêm do corpo; responde { status, linhasAfetadas }.
const InsertAnimal = (request, res) =>
  (async () => {
    const registro = request.body;
    let { msg, linhasAfetadas } = await mdlAnimais.InsertAnimal(registro);
    res.json({ status: msg, linhasAfetadas: linhasAfetadas });
  })();

// ID pela URL, dados pelo corpo.
const UpdateAnimal = (request, res) =>
  (async () => {
    const animalID = parseInt(request.params.animalid);
    const registro = request.body;
    let { msg, linhasAfetadas } = await mdlAnimais.UpdateAnimal(animalID, registro);
    res.json({ status: msg, linhasAfetadas: linhasAfetadas });
  })();

// Remove (soft delete) pelo ID da URL.
const DeleteAnimal = (request, res) =>
  (async () => {
    const animalID = parseInt(request.params.animalid);
    let { msg, linhasAfetadas } = await mdlAnimais.DeleteAnimal(animalID);
    res.json({ status: msg, linhasAfetadas: linhasAfetadas });
  })();

module.exports = {
  GetAllAnimais,
  GetAnimalByID,
  InsertAnimal,
  UpdateAnimal,
  DeleteAnimal
};
