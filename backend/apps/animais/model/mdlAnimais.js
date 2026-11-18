// SQL da tabela animal.
const db = require("../../../database/databaseconfig");

// Animais não removidos, por nome.
const GetAllAnimais = async () => {
  return (
    await db.query(
      "SELECT * " + "FROM animal where removido = false ORDER BY nome ASC"
    )
  ).rows;
};

// Animal pelo ID ($1 = parâmetro, evita SQL Injection).
const GetAnimalByID = async (animalIDPar) => {
  return (
    await db.query(
      "SELECT * " +
        "FROM animal WHERE animalid = $1 and removido = false ORDER BY nome ASC",
      [animalIDPar]
    )
  ).rows;
};

// Insere e devolve { msg, linhasAfetadas }.
const InsertAnimal = async (registroPar) => {
  //@ Atenção: aqui já começamos a utilizar a variável msg para retornor erros de banco de dados.
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO animal " + "values(default, $1, $2, $3)",
        [
          registroPar.nome,
          registroPar.datanasc,
          registroPar.removido,
        ]
      )
    ).rowCount;
  // Erro do banco: devolve a mensagem e -1.
  } catch (error) {
    msg = "[mdlAnimais|InsertAnimal] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

// Atualiza o animal ($1 = ID).
const UpdateAnimal = async (animalIDPar, registroPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE animal SET " +
          "nome = $2, " +
          "datanasc = $3, " +
          "removido = $4 " +
          "WHERE animalid = $1",
        [
            animalIDPar,
            registroPar.nome,
            registroPar.datanasc,
            registroPar.removido,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = "[mdlAnimais|UpdateAnimal] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};


const DeleteAnimal = async (animalIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    // R1: animal com alocações ativas não pode ser removido.
    // COUNT(*) volta como texto no pg; por isso o Number().
    const { total } = (
      await db.query(
        "SELECT COUNT(*) AS total FROM alocado WHERE animalidifk = $1 AND removido = false",
        [animalIDPar]
      )
    ).rows[0];
    if (Number(total) > 0) {
      return { msg: "Não é possível remover: este animal possui alocações cadastradas.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
    await db.query(
      "UPDATE animal SET " + "removido = true " + "WHERE animalid = $1",
      [animalIDPar]
    )
  ).rowCount;
} catch (error) {
  msg = "[mdlAnimais|DeleteAnimal] " + (error.detail || error.message);
  linhasAfetadas = -1;
}

return { msg, linhasAfetadas };
};


module.exports = {
  GetAllAnimais,
  GetAnimalByID,
  InsertAnimal,
  UpdateAnimal,
  DeleteAnimal,
};
