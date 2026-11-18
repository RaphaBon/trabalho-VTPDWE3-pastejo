// Formulário de piquetes: age conforme ?oper= da URL.
document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmPiquetes');

  if (!form) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var oper = parametros.get('oper') || parametros.get('Oper');
  var servidorDw3 = form.dataset.servidorDw3;
  var btnInserir = document.getElementById('btnInserirPiquete');
  var btnAtualizar = document.getElementById('btnAtualizarPiquete');

  // Ativa o Select2 no pasto.
  inicializarSelectPastos();

  // Cr: incluir.
  if (oper === 'Cr') {
    btnInserir.classList.remove('d-none'); // Torna o Botão visível.
    carregarPastosToPiquetes(servidorDw3);
  }

  // Re: visualizar, com campos desabilitados.
  if (oper === 'Re') {
    // Modo visualizar: todos os campos ficam desabilitados.
    form.querySelectorAll('input, select').forEach(function(campo) {
      campo.disabled = true;
    });
    vwGetPiqueteByID();
  }

  // Up: atualizar.
  if (oper === 'Up') {
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetPiqueteByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdatePiquete();
    });
  }


  // De: remover.
  if (oper === 'De') {
    var btnRemover = document.getElementById('btnRemoverPiquete');
    btnRemover.classList.remove('d-none');
    btnRemover.disabled = !(await vwGetPiqueteByID());
    btnRemover.addEventListener('click', function() {
      vwDeletePiquete();
    });
  }

  if (btnInserir) {
    btnInserir.addEventListener('click', function() {
      vwInsertPiquete();
    });
  }
});

// Aqui é inicializado o componente Select2.js em branco
function inicializarSelectPastos() {
  $('#pastoidfk').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um pasto',
    width: '100%'
  });
}

// Aqui é preenchido o componente Select2 com os pastos disponíveis
// GET /getPastosToPiquetes com o token.
async function carregarPastosToPiquetes(servidorDw3) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getPastosToPiquetes', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Não foi possivel carregar os pastos.');
    }

    var data = await response.json();

    // Sessão expirada: volta ao login.
    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessão expirada. Faca login novamente.');
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error('Resposta invalida do servidor backend.');
    }

    preencherSelectPastos(data.registro);
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar pastos.');
    return false;
  }
}

// Uma opção por pasto: a descrição.
function preencherSelectPastos(pastos) {
  var pastoSelect = document.getElementById('pastoidfk');

  if (!pastoSelect) {
    return;
  }

  pastoSelect.innerHTML = '<option value="">Selecione um pasto</option>';

  pastos.forEach(function(pasto) {
    var option = document.createElement('option');
    option.value = pasto.pastoid;
    option.textContent = pasto.descricao;
    pastoSelect.appendChild(option);
  });

  $('#pastoidfk').trigger('change');
}

// POST /insertPiquete.
async function vwInsertPiquete() {
  var form = document.getElementById('frmPiquetes');
  var btnInserir = document.getElementById('btnInserirPiquete');

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
    var response = await fetch(servidorDw3 + '/insertPiquete', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPiqueteDoFormulario())
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel inserir o piquete.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel inserir o piquete.');
    }

    window.location.href = '/piquetes';
  } catch (error) {
    alert(error.message || 'Erro ao inserir piquete.');
  } finally {
    if (btnInserir) {
      btnInserir.disabled = false;
    }
  }
}


// Busca o piquete e preenche o formulário.
async function vwGetPiqueteByID() {
  var form = document.getElementById('frmPiquetes');

  try {
    var parametros = new URLSearchParams(window.location.search);
    var piqueteId = parametros.get('piqueteId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!piqueteId || !/^\d+$/.test(piqueteId) || Number(piqueteId) <= 0) {
      throw new Error('ID do piquete invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getPiqueteByID/' + encodeURIComponent(piqueteId), {
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      })
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar o piquete.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error('Resposta invalida do servidor backend.');
    }

    var piquete = data.registro[0];

    if (!piquete) {
      throw new Error('Piquete nao encontrado.');
    }

    document.getElementById('piqueteid').value = piquete.piqueteid;
    document.getElementById('descricao').value = piquete.descricao ?? '';
    document.getElementById('latitude').value = piquete.latitude ?? '';
    document.getElementById('longitude').value = piquete.longitude ?? '';
    document.getElementById('removido').value = String(piquete.removido === true);

    if (!(await carregarPastosToPiquetes(servidorDw3))) {
      return false;
    }
    // Seleciona o pasto no Select2.
    $('#pastoidfk').val(piquete.pastoidfk).trigger('change');
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar piquete.');
    return false;
  }
}




// PUT /updatePiquete/:id.
async function vwUpdatePiquete() {
  var form = document.getElementById('frmPiquetes');
  var btnAtualizar = document.getElementById('btnAtualizarPiquete');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var piqueteId = new URLSearchParams(window.location.search).get('piqueteId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!piqueteId || !/^\d+$/.test(piqueteId) || Number(piqueteId) <= 0) {
      throw new Error('ID do piquete invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnAtualizar.disabled = true;

    var piquete = montarPiqueteDoFormulario();
    piquete.latitude = Number(piquete.latitude);
    piquete.longitude = Number(piquete.longitude);
    piquete.pastoidfk = Number(piquete.pastoidfk);

    var response = await fetch(servidorDw3 + '/updatePiquete/' + encodeURIComponent(piqueteId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(piquete)
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel atualizar o piquete.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel atualizar o piquete.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum piquete foi atualizado.');
    }

    alert('Piquete atualizado com sucesso.');
  } catch (error) {
    alert(error.message || 'Erro ao atualizar piquete.');
  } finally {
    btnAtualizar.disabled = false;
  }
}


// DELETE /deletePiquete/:id (soft delete).
async function vwDeletePiquete() {
  var form = document.getElementById('frmPiquetes');
  var btnRemover = document.getElementById('btnRemoverPiquete');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste piquete?')) {
    return;
  }

  try {
    var piqueteId = document.getElementById('piqueteid').value;
    var servidorDw3 = form.dataset.servidorDw3;

    if (!piqueteId || !/^\d+$/.test(piqueteId) || Number(piqueteId) <= 0) {
      throw new Error('ID do piquete invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnRemover.disabled = true;

    var response = await fetch(servidorDw3 + '/deletePiquete/' + encodeURIComponent(piqueteId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel remover o piquete.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel remover o piquete.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum piquete foi removido.');
    }

    window.location.href = '/piquetes';
  } catch (error) {
    alert(error.message || 'Erro ao remover piquete.');
  } finally {
    btnRemover.disabled = false;
  }
}




// Monta o objeto com os campos do formulário.
function montarPiqueteDoFormulario() {
  return {
    descricao: document.getElementById('descricao').value,
    latitude: document.getElementById('latitude').value,
    longitude: document.getElementById('longitude').value,
    pastoidfk: document.getElementById('pastoidfk').value,
    removido: document.getElementById('removido').value === 'true'
  };
}
