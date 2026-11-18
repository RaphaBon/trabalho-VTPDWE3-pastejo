// Formulário de alocações: age conforme ?oper= da URL.
document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmAlocados');

  if (!form) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var oper = parametros.get('oper') || parametros.get('Oper');
  var servidorDw3 = form.dataset.servidorDw3;
  var btnInserir = document.getElementById('btnInserirAlocado');
  var btnAtualizar = document.getElementById('btnAtualizarAlocado');

  // Ativa os Select2 no animal e no piquete.
  inicializarSelectAnimais();
  inicializarSelectPiquetes();

  // Cr: incluir.
  if (oper === 'Cr') {
    btnInserir.classList.remove('d-none'); // Torna o Botão visível.
    carregarAnimaisToAlocados(servidorDw3);
    carregarPiquetesToAlocados(servidorDw3);
  }

  // Re: visualizar, com campos desabilitados.
  if (oper === 'Re') {
    // Modo visualizar: todos os campos ficam desabilitados.
    form.querySelectorAll('input, select').forEach(function(campo) {
      campo.disabled = true;
    });
    vwGetAlocadoByID();
  }

  // Up: atualizar.
  if (oper === 'Up') {
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetAlocadoByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdateAlocado();
    });
  }


  // De: remover.
  if (oper === 'De') {
    var btnRemover = document.getElementById('btnRemoverAlocado');
    btnRemover.classList.remove('d-none');
    btnRemover.disabled = !(await vwGetAlocadoByID());
    btnRemover.addEventListener('click', function() {
      vwDeleteAlocado();
    });
  }

  if (btnInserir) {
    btnInserir.addEventListener('click', function() {
      vwInsertAlocado();
    });
  }
});

// Aqui são inicializados os dois componentes Select2.js em branco
function inicializarSelectAnimais() {
  $('#animalidifk').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um animal',
    width: '100%'
  });
}

function inicializarSelectPiquetes() {
  $('#piqueteidfk').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um piquete',
    width: '100%'
  });
}

// Aqui é preenchido o componente Select2 com os animais disponíveis
// GET /getAnimaisToAlocados com o token.
async function carregarAnimaisToAlocados(servidorDw3) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAnimaisToAlocados', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Não foi possivel carregar os animais.');
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

    preencherSelectAnimais(data.registro);
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar animais.');
    return false;
  }
}

// Uma opção por animal: o nome.
function preencherSelectAnimais(animais) {
  var animalSelect = document.getElementById('animalidifk');

  if (!animalSelect) {
    return;
  }

  animalSelect.innerHTML = '<option value="">Selecione um animal</option>';

  animais.forEach(function(animal) {
    var option = document.createElement('option');
    option.value = animal.animalid;
    option.textContent = animal.nome;
    animalSelect.appendChild(option);
  });

  $('#animalidifk').trigger('change');
}

// Aqui é preenchido o componente Select2 com os piquetes disponíveis
// GET /getPiquetesToAlocados com o token.
async function carregarPiquetesToAlocados(servidorDw3) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getPiquetesToAlocados', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Não foi possivel carregar os piquetes.');
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

    preencherSelectPiquetes(data.registro);
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar piquetes.');
    return false;
  }
}

// Uma opção por piquete: a descrição.
function preencherSelectPiquetes(piquetes) {
  var piqueteSelect = document.getElementById('piqueteidfk');

  if (!piqueteSelect) {
    return;
  }

  piqueteSelect.innerHTML = '<option value="">Selecione um piquete</option>';

  piquetes.forEach(function(piquete) {
    var option = document.createElement('option');
    option.value = piquete.piqueteid;
    option.textContent = piquete.descricao;
    piqueteSelect.appendChild(option);
  });

  $('#piqueteidfk').trigger('change');
}

// POST /insertAlocado.
async function vwInsertAlocado() {
  var form = document.getElementById('frmAlocados');
  var btnInserir = document.getElementById('btnInserirAlocado');

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
    var response = await fetch(servidorDw3 + '/insertAlocado', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarAlocadoDoFormulario())
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel inserir a alocação.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel inserir a alocação.');
    }

    window.location.href = '/alocados';
  } catch (error) {
    alert(error.message || 'Erro ao inserir alocação.');
  } finally {
    if (btnInserir) {
      btnInserir.disabled = false;
    }
  }
}


// Busca a alocação e preenche o formulário.
async function vwGetAlocadoByID() {
  var form = document.getElementById('frmAlocados');

  try {
    var parametros = new URLSearchParams(window.location.search);
    var alocadoId = parametros.get('alocadoId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!alocadoId || !/^\d+$/.test(alocadoId) || Number(alocadoId) <= 0) {
      throw new Error('ID da alocação invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAlocadoByID/' + encodeURIComponent(alocadoId), {
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      })
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a alocação.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error('Resposta invalida do servidor backend.');
    }

    var alocado = data.registro[0];

    if (!alocado) {
      throw new Error('Alocação nao encontrada.');
    }

    document.getElementById('alocadoid').value = alocado.alocadoid;
    document.getElementById('datainicio').value = alocado.datainicio ? alocado.datainicio.slice(0, 10) : '';
    document.getElementById('datafinal').value = alocado.datafinal ? alocado.datafinal.slice(0, 10) : '';
    document.getElementById('removido').value = String(alocado.removido === true);

    if (!(await carregarAnimaisToAlocados(servidorDw3))) {
      return false;
    }
    if (!(await carregarPiquetesToAlocados(servidorDw3))) {
      return false;
    }
    // Seleciona o animal e o piquete nos dois Select2.
    $('#animalidifk').val(alocado.animalidifk).trigger('change');
    $('#piqueteidfk').val(alocado.piqueteidfk).trigger('change');
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar alocação.');
    return false;
  }
}




// PUT /updateAlocado/:id.
async function vwUpdateAlocado() {
  var form = document.getElementById('frmAlocados');
  var btnAtualizar = document.getElementById('btnAtualizarAlocado');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var alocadoId = new URLSearchParams(window.location.search).get('alocadoId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!alocadoId || !/^\d+$/.test(alocadoId) || Number(alocadoId) <= 0) {
      throw new Error('ID da alocação invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnAtualizar.disabled = true;

    var alocado = montarAlocadoDoFormulario();
    alocado.animalidifk = Number(alocado.animalidifk);
    alocado.piqueteidfk = Number(alocado.piqueteidfk);

    var response = await fetch(servidorDw3 + '/updateAlocado/' + encodeURIComponent(alocadoId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(alocado)
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel atualizar a alocação.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel atualizar a alocação.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhuma alocação foi atualizada.');
    }

    alert('Alocação atualizada com sucesso.');
  } catch (error) {
    alert(error.message || 'Erro ao atualizar alocação.');
  } finally {
    btnAtualizar.disabled = false;
  }
}


// DELETE /deleteAlocado/:id (soft delete).
async function vwDeleteAlocado() {
  var form = document.getElementById('frmAlocados');
  var btnRemover = document.getElementById('btnRemoverAlocado');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção desta alocação?')) {
    return;
  }

  try {
    var alocadoId = document.getElementById('alocadoid').value;
    var servidorDw3 = form.dataset.servidorDw3;

    if (!alocadoId || !/^\d+$/.test(alocadoId) || Number(alocadoId) <= 0) {
      throw new Error('ID da alocação invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnRemover.disabled = true;

    var response = await fetch(servidorDw3 + '/deleteAlocado/' + encodeURIComponent(alocadoId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel remover a alocação.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel remover a alocação.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhuma alocação foi removida.');
    }

    window.location.href = '/alocados';
  } catch (error) {
    alert(error.message || 'Erro ao remover alocação.');
  } finally {
    btnRemover.disabled = false;
  }
}




// Monta o objeto com os campos do formulário.
function montarAlocadoDoFormulario() {
  return {
    animalidifk: document.getElementById('animalidifk').value,
    piqueteidfk: document.getElementById('piqueteidfk').value,
    datainicio: document.getElementById('datainicio').value,
    datafinal: document.getElementById('datafinal').value,
    removido: document.getElementById('removido').value === 'true'
  };
}
