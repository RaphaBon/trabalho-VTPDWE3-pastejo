// SQL da tabela pasto.
const db = require("../../../database/databaseconfig");

// Pastos não removidos, por descrição.
const GetAllPastos = async () => {
  return (
    await db.query(
      "SELECT * " + "FROM pasto where removido = false ORDER BY descricao ASC"
    )
  ).rows;
};

// Pasto pelo ID ($1 = parâmetro, evita SQL Injection).
const GetPastoByID = async (pastoIDPar) => {
  return (
    await db.query(
      "SELECT * " +
        "FROM pasto WHERE pastoid = $1 and removido = false ORDER BY descricao ASC",
      [pastoIDPar]
    )
  ).rows;
};

// Insere e devolve { msg, linhasAfetadas }.
const InsertPasto = async (registroPar) => {
  //@ Atenção: aqui já começamos a utilizar a variável msg para retornor erros de banco de dados.
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO pasto " + "values(default, $1, $2, $3)",
        [
          registroPar.descricao,
          registroPar.areatotal,
          registroPar.removido,
        ]
      )
    ).rowCount;
  // Erro do banco: devolve a mensagem e -1.
  } catch (error) {
    msg = "[mdlPastos|InsertPasto] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

// Atualiza o pasto ($1 = ID).
const UpdatePasto = async (pastoIDPar, registroPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE pasto SET " +
          "descricao = $2, " +
          "areatotal = $3, " +
          "removido = $4 " +
          "WHERE pastoid = $1",
        [
            pastoIDPar,
            registroPar.descricao,
            registroPar.areatotal,
            registroPar.removido,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = "[mdlPastos|UpdatePasto] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};


const DeletePasto = async (pastoIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    // R1: pasto com piquetes ativos não pode ser removido.
    // COUNT(*) volta como texto no pg; por isso o Number().
    const { total } = (
      await db.query(
        "SELECT COUNT(*) AS total FROM piquete WHERE pastoidfk = $1 AND removido = false",
        [pastoIDPar]
      )
    ).rows[0];
    if (Number(total) > 0) {
      return { msg: "Não é possível remover: este pasto possui piquetes cadastrados.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
    await db.query(
      "UPDATE pasto SET " + "removido = true " + "WHERE pastoid = $1",
      [pastoIDPar]
    )
  ).rowCount;
} catch (error) {
  msg = "[mdlPastos|DeletePasto] " + (error.detail || error.message);
  linhasAfetadas = -1;
}

return { msg, linhasAfetadas };
};


module.exports = {
  GetAllPastos,
  GetPastoByID,
  InsertPasto,
  UpdatePasto,
  DeletePasto,
};
