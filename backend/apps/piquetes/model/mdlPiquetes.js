// SQL da tabela piquete.
//-- arquivo apps/piquetes/model/mdlPiquetes.js

const db = require("../../../database/databaseconfig");

// Piquetes ativos por descrição; o subselect traz a descrição do pasto.
const GetAllPiquetes = async () => {
  return (
    await db.query(
      "SELECT *, (SELECT descricao from PASTO where pastoid = piquete.pastoidfk) AS pasto " +
        "FROM piquete where removido = false ORDER BY descricao ASC"
    )
  ).rows;
};

// Piquete pelo ID ($1).
const GetPiqueteByID = async (piqueteIDPar) => {
  return (
    await db.query(
      "SELECT *, (SELECT descricao from PASTO where pastoid = piquete.pastoidfk) AS pasto " +
        "FROM piquete WHERE piqueteid = $1 and removido = false ORDER BY descricao ASC",
      [piqueteIDPar]
    )
  ).rows;
};

// Pastos ativos para o Select2.
const GetPastosToPiquetes = async () => {
  return (
    await db.query(
      "select pastoid, descricao from pasto where removido = false"
    )
  ).rows;
};

// Insere e devolve { msg, linhasAfetadas }.
const InsertPiquete = async (piqueteREGPar) => {
  //@ Atenção: aqui já começamos a utilizar a variável msg para retornor erros de banco de dados.
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO piquete " + "values(default, $1, $2, $3, $4, $5)",
        [
          piqueteREGPar.descricao,
          piqueteREGPar.latitude,
          piqueteREGPar.longitude,
          piqueteREGPar.pastoidfk,
          piqueteREGPar.removido,
        ]
      )
    ).rowCount;
  // Erro do banco (ex.: pasto inexistente): mensagem e -1.
  } catch (error) {
    msg = "[mdlPiquetes|InsertPiquete] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

// Atualiza o piquete ($1 = ID).
const UpdatePiquete = async (piqueteIDPar, piqueteREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE piquete SET " +
          "descricao = $2, " +
          "latitude = $3, " +
          "longitude = $4, " +
          "pastoidfk = $5, " +
          "removido = $6 " +
          "WHERE piqueteid = $1",
        [
           piqueteIDPar,
          piqueteREGPar.descricao,
          piqueteREGPar.latitude,
          piqueteREGPar.longitude,
          piqueteREGPar.pastoidfk,
          piqueteREGPar.removido,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = "[mdlPiquetes|UpdatePiquete] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

// Soft delete: marca removido = true em vez de apagar.
const DeletePiquete = async (piqueteIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    // R1: piquete com animais alocados (ativos) não pode ser removido.
    // COUNT(*) volta como texto no pg; por isso o Number().
    const { total } = (
      await db.query(
        "SELECT COUNT(*) AS total FROM alocado WHERE piqueteidfk = $1 AND removido = false",
        [piqueteIDPar]
      )
    ).rows[0];
    if (Number(total) > 0) {
      return { msg: "Não é possível remover: este piquete possui animais alocados.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
    await db.query(
      "UPDATE piquete SET " + "removido = true " + "WHERE piqueteid = $1",
      [piqueteIDPar]
    )
  ).rowCount;
} catch (error) {
  msg = "[mdlPiquetes|DeletePiquete] " + (error.detail || error.message);
  linhasAfetadas = -1;
}

return { msg, linhasAfetadas };
};

module.exports = {
  GetAllPiquetes,
  GetPiqueteByID,
  GetPastosToPiquetes,
  InsertPiquete,
  UpdatePiquete,
  DeletePiquete,
};
