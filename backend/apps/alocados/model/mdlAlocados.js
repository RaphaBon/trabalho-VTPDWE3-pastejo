// SQL da tabela alocado.
//-- arquivo apps/alocados/model/mdlAlocados.js

const db = require("../../../database/databaseconfig");

// Alocações ativas por data de início; os subselects trazem o nome do animal e a descrição do piquete.
const GetAllAlocados = async () => {
  return (
    await db.query(
      "SELECT *, (SELECT nome from ANIMAL where animalid = alocado.animalidifk) AS animal, (SELECT descricao from PIQUETE where piqueteid = alocado.piqueteidfk) AS piquete " +
        "FROM alocado where removido = false ORDER BY datainicio ASC"
    )
  ).rows;
};

// Alocação pelo ID ($1).
const GetAlocadoByID = async (alocadoIDPar) => {
  return (
    await db.query(
      "SELECT *, (SELECT nome from ANIMAL where animalid = alocado.animalidifk) AS animal, (SELECT descricao from PIQUETE where piqueteid = alocado.piqueteidfk) AS piquete " +
        "FROM alocado WHERE alocadoid = $1 and removido = false ORDER BY datainicio ASC",
      [alocadoIDPar]
    )
  ).rows;
};

// Animais ativos para o Select2.
const GetAnimaisToAlocados = async () => {
  return (
    await db.query(
      "select animalid, nome from animal where removido = false"
    )
  ).rows;
};

// Piquetes ativos para o Select2.
const GetPiquetesToAlocados = async () => {
  return (
    await db.query(
      "select piqueteid, descricao from piquete where removido = false"
    )
  ).rows;
};

// Insere e devolve { msg, linhasAfetadas }.
const InsertAlocado = async (alocadoREGPar) => {
  //@ Atenção: aqui já começamos a utilizar a variável msg para retornor erros de banco de dados.
  let linhasAfetadas;
  let msg = "ok";
  try {
    // R3: período invertido (data final antes da inicial) não é gravado.
    // Datas 'AAAA-MM-DD' podem ser comparadas como texto; o CHECK do banco é a garantia final.
    if (alocadoREGPar.datafinal && alocadoREGPar.datafinal < alocadoREGPar.datainicio) {
      return { msg: "A data final não pode ser anterior à data inicial.", linhasAfetadas: -1 };
    }

    // R2: o animal não pode estar em dois piquetes no mesmo período.
    // datafinal NULL vale como 'infinity' (ainda no piquete); $4 = 0 no insert.
    const { total } = (
      await db.query(
        "SELECT COUNT(*) AS total FROM alocado " +
          "WHERE animalidifk = $1 AND removido = false AND alocadoid <> $4 " +
          "AND datainicio <= COALESCE($3::date, 'infinity') " +
          "AND COALESCE(datafinal, 'infinity') >= $2::date",
        [
          alocadoREGPar.animalidifk,
          alocadoREGPar.datainicio,
          alocadoREGPar.datafinal || null,
          0,
        ]
      )
    ).rows[0];
    // COUNT(*) volta como texto no pg; por isso o Number().
    if (Number(total) > 0) {
      return { msg: "Este animal já está alocado em outro piquete nesse período.", linhasAfetadas: -1 };
    }

    linhasAfetadas = (
      await db.query(
        "INSERT INTO alocado " + "values(default, $1, $2, $3, $4, $5)",
        [
          alocadoREGPar.animalidifk,
          alocadoREGPar.piqueteidfk,
          alocadoREGPar.datainicio,
          // Data vazia vira NULL (animal ainda no piquete).
          alocadoREGPar.datafinal || null,
          alocadoREGPar.removido,
        ]
      )
    ).rowCount;
  // Erro do banco (ex.: período invertido, barrado pelo CHECK): mensagem e -1.
  } catch (error) {
    msg = "[mdlAlocados|InsertAlocado] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

// Atualiza a alocação ($1 = ID).
const UpdateAlocado = async (alocadoIDPar, alocadoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    // R3: período invertido (data final antes da inicial) não é gravado.
    // Datas 'AAAA-MM-DD' podem ser comparadas como texto; o CHECK do banco é a garantia final.
    if (alocadoREGPar.datafinal && alocadoREGPar.datafinal < alocadoREGPar.datainicio) {
      return { msg: "A data final não pode ser anterior à data inicial.", linhasAfetadas: -1 };
    }

    // R2: o animal não pode estar em dois piquetes no mesmo período.
    // $4 = a própria alocação, para não bloquear a si mesma.
    const { total } = (
      await db.query(
        "SELECT COUNT(*) AS total FROM alocado " +
          "WHERE animalidifk = $1 AND removido = false AND alocadoid <> $4 " +
          "AND datainicio <= COALESCE($3::date, 'infinity') " +
          "AND COALESCE(datafinal, 'infinity') >= $2::date",
        [
          alocadoREGPar.animalidifk,
          alocadoREGPar.datainicio,
          alocadoREGPar.datafinal || null,
          alocadoIDPar,
        ]
      )
    ).rows[0];
    // COUNT(*) volta como texto no pg; por isso o Number().
    if (Number(total) > 0) {
      return { msg: "Este animal já está alocado em outro piquete nesse período.", linhasAfetadas: -1 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE alocado SET " +
          "animalidifk = $2, " +
          "piqueteidfk = $3, " +
          "datainicio = $4, " +
          "datafinal = $5, " +
          "removido = $6 " +
          "WHERE alocadoid = $1",
        [
           alocadoIDPar,
          alocadoREGPar.animalidifk,
          alocadoREGPar.piqueteidfk,
          alocadoREGPar.datainicio,
          alocadoREGPar.datafinal || null,
          alocadoREGPar.removido,
        ]
      )
    ).rowCount;
  } catch (error) {
    msg = "[mdlAlocados|UpdateAlocado] " + (error.detail || error.message);
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

// Soft delete: marca removido = true em vez de apagar.
const DeleteAlocado = async (alocadoIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    linhasAfetadas = (
    await db.query(
      "UPDATE alocado SET " + "removido = true " + "WHERE alocadoid = $1",
      [alocadoIDPar]
    )
  ).rowCount;
} catch (error) {
  msg = "[mdlAlocados|DeleteAlocado] " + (error.detail || error.message);
  linhasAfetadas = -1;
}

return { msg, linhasAfetadas };
};

module.exports = {
  GetAllAlocados,
  GetAlocadoByID,
  GetAnimaisToAlocados,
  GetPiquetesToAlocados,
  InsertAlocado,
  UpdateAlocado,
  DeleteAlocado,
};
