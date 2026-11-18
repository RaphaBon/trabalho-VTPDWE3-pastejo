// Formulário de pastos: age conforme ?oper= da URL.
document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmPastos');

  if (!form) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var oper = parametros.get('oper') || parametros.get('Oper');
  var btnInserir = document.getElementById('btnInserirPasto');
  var btnAtualizar = document.getElementById('btnAtualizarPasto');

  // Cr: incluir.
  if (oper === 'Cr') {
    btnInserir.classList.remove('d-none'); // Torna o Botão visível.
  }

  // Re: visualizar, com campos desabilitados.
  if (oper === 'Re') {
    // Modo visualizar: todos os campos ficam desabilitados.
    form.querySelectorAll('input, select').forEach(function(campo) {
      campo.disabled = true;
    });
    vwGetPastoByID();
  }

  // Up: atualizar.
  if (oper === 'Up') {
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetPastoByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdatePasto();
    });
  }


  // De: remover.
  if (oper === 'De') {
    var btnRemover = document.getElementById('btnRemoverPasto');
    btnRemover.classList.remove('d-none');
    btnRemover.disabled = !(await vwGetPastoByID());
    btnRemover.addEventListener('click', function() {
      vwDeletePasto();
    });
  }

  if (btnInserir) {
    btnInserir.addEventListener('click', function() {
      vwInsertPasto();
    });
  }
});

// POST /insertPasto.
async function vwInsertPasto() {
  var form = document.getElementById('frmPastos');
  var btnInserir = document.getElementById('btnInserirPasto');

  try {
    if (!form.reportValidity()) {
      return;
    }

    var servidorDw3 = form.dataset.servidorDw3;

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    if (btnInserir) {
      btnInserir.disabled = true;
    }

    // Envia o token no Authorization e os dados em JSON.
    var response = await fetch(servidorDw3 + '/insertPasto', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPastoDoFormulario())
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel inserir o pasto.');
    }

    var data = await response.json();

    // Sessão expirada: volta ao login.
    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel inserir o pasto.');
    }

    window.location.href = '/pastos';
  } catch (error) {
    alert(error.message || 'Erro ao inserir pasto.');
  } finally {
    if (btnInserir) {
      btnInserir.disabled = false;
    }
  }
}


// Busca o pasto e preenche o formulário.
async function vwGetPastoByID() {
  var form = document.getElementById('frmPastos');

  try {
    var parametros = new URLSearchParams(window.location.search);
    var pastoId = parametros.get('pastoId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!pastoId || !/^\d+$/.test(pastoId) || Number(pastoId) <= 0) {
      throw new Error('ID do pasto invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getPastoByID/' + encodeURIComponent(pastoId), {
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      })
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar o pasto.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error('Resposta invalida do servidor backend.');
    }

    var pasto = data.registro[0];

    if (!pasto) {
      throw new Error('Pasto nao encontrado.');
    }

    document.getElementById('pastoid').value = pasto.pastoid;
    document.getElementById('descricao').value = pasto.descricao ?? '';
    document.getElementById('areatotal').value = pasto.areatotal ?? '';
    document.getElementById('removido').value = String(pasto.removido === true);

    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar pasto.');
    return false;
  }
}




// PUT /updatePasto/:id.
async function vwUpdatePasto() {
  var form = document.getElementById('frmPastos');
  var btnAtualizar = document.getElementById('btnAtualizarPasto');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var pastoId = new URLSearchParams(window.location.search).get('pastoId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!pastoId || !/^\d+$/.test(pastoId) || Number(pastoId) <= 0) {
      throw new Error('ID do pasto invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnAtualizar.disabled = true;

    var pasto = montarPastoDoFormulario();
    pasto.areatotal = Number(pasto.areatotal);

    var response = await fetch(servidorDw3 + '/updatePasto/' + encodeURIComponent(pastoId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(pasto)
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel atualizar o pasto.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel atualizar o pasto.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum pasto foi atualizado.');
    }

    alert('Pasto atualizado com sucesso.');
  } catch (error) {
    alert(error.message || 'Erro ao atualizar pasto.');
  } finally {
    btnAtualizar.disabled = false;
  }
}


// DELETE /deletePasto/:id (soft delete).
async function vwDeletePasto() {
  var form = document.getElementById('frmPastos');
  var btnRemover = document.getElementById('btnRemoverPasto');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste pasto?')) {
    return;
  }

  try {
    var pastoId = document.getElementById('pastoid').value;
    var servidorDw3 = form.dataset.servidorDw3;

    if (!pastoId || !/^\d+$/.test(pastoId) || Number(pastoId) <= 0) {
      throw new Error('ID do pasto invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnRemover.disabled = true;

    var response = await fetch(servidorDw3 + '/deletePasto/' + encodeURIComponent(pastoId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel remover o pasto.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel remover o pasto.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum pasto foi removido.');
    }

    window.location.href = '/pastos';
  } catch (error) {
    alert(error.message || 'Erro ao remover pasto.');
  } finally {
    btnRemover.disabled = false;
  }
}




// Monta o objeto com os campos do formulário.
function montarPastoDoFormulario() {
  return {
    descricao: document.getElementById('descricao').value,
    areatotal: document.getElementById('areatotal').value,
    removido: document.getElementById('removido').value === 'true'
  };
}
