// Formulário de animais: age conforme ?oper= da URL.
document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmAnimais');

  if (!form) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var oper = parametros.get('oper') || parametros.get('Oper');
  var btnInserir = document.getElementById('btnInserirAnimal');
  var btnAtualizar = document.getElementById('btnAtualizarAnimal');

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
    vwGetAnimalByID();
  }

  // Up: atualizar.
  if (oper === 'Up') {
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetAnimalByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdateAnimal();
    });
  }


  // De: remover.
  if (oper === 'De') {
    var btnRemover = document.getElementById('btnRemoverAnimal');
    btnRemover.classList.remove('d-none');
    btnRemover.disabled = !(await vwGetAnimalByID());
    btnRemover.addEventListener('click', function() {
      vwDeleteAnimal();
    });
  }

  if (btnInserir) {
    btnInserir.addEventListener('click', function() {
      vwInsertAnimal();
    });
  }
});

// POST /insertAnimal.
async function vwInsertAnimal() {
  var form = document.getElementById('frmAnimais');
  var btnInserir = document.getElementById('btnInserirAnimal');

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
    var response = await fetch(servidorDw3 + '/insertAnimal', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarAnimalDoFormulario())
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel inserir o animal.');
    }

    var data = await response.json();

    // Sessão expirada: volta ao login.
    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel inserir o animal.');
    }

    window.location.href = '/animais';
  } catch (error) {
    alert(error.message || 'Erro ao inserir animal.');
  } finally {
    if (btnInserir) {
      btnInserir.disabled = false;
    }
  }
}


// Busca o animal e preenche o formulário.
async function vwGetAnimalByID() {
  var form = document.getElementById('frmAnimais');

  try {
    var parametros = new URLSearchParams(window.location.search);
    var animalId = parametros.get('animalId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!animalId || !/^\d+$/.test(animalId) || Number(animalId) <= 0) {
      throw new Error('ID do animal invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAnimalByID/' + encodeURIComponent(animalId), {
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      })
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar o animal.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error('Resposta invalida do servidor backend.');
    }

    var animal = data.registro[0];

    if (!animal) {
      throw new Error('Animal nao encontrado.');
    }

    document.getElementById('animalid').value = animal.animalid;
    document.getElementById('nome').value = animal.nome ?? '';
    document.getElementById('datanasc').value = animal.datanasc ? animal.datanasc.slice(0, 10) : '';
    document.getElementById('removido').value = String(animal.removido === true);

    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar animal.');
    return false;
  }
}




// PUT /updateAnimal/:id.
async function vwUpdateAnimal() {
  var form = document.getElementById('frmAnimais');
  var btnAtualizar = document.getElementById('btnAtualizarAnimal');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var animalId = new URLSearchParams(window.location.search).get('animalId');
    var servidorDw3 = form.dataset.servidorDw3;

    if (!animalId || !/^\d+$/.test(animalId) || Number(animalId) <= 0) {
      throw new Error('ID do animal invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnAtualizar.disabled = true;

    var animal = montarAnimalDoFormulario();

    var response = await fetch(servidorDw3 + '/updateAnimal/' + encodeURIComponent(animalId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(animal)
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel atualizar o animal.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel atualizar o animal.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum animal foi atualizado.');
    }

    alert('Animal atualizado com sucesso.');
  } catch (error) {
    alert(error.message || 'Erro ao atualizar animal.');
  } finally {
    btnAtualizar.disabled = false;
  }
}


// DELETE /deleteAnimal/:id (soft delete).
async function vwDeleteAnimal() {
  var form = document.getElementById('frmAnimais');
  var btnRemover = document.getElementById('btnRemoverAnimal');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste animal?')) {
    return;
  }

  try {
    var animalId = document.getElementById('animalid').value;
    var servidorDw3 = form.dataset.servidorDw3;

    if (!animalId || !/^\d+$/.test(animalId) || Number(animalId) <= 0) {
      throw new Error('ID do animal invalido.');
    }

    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    btnRemover.disabled = true;

    var response = await fetch(servidorDw3 + '/deleteAnimal/' + encodeURIComponent(animalId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel remover o animal.');
    }

    var data = await response.json();

    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Nao foi possivel remover o animal.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum animal foi removido.');
    }

    window.location.href = '/animais';
  } catch (error) {
    alert(error.message || 'Erro ao remover animal.');
  } finally {
    btnRemover.disabled = false;
  }
}




// Monta o objeto com os campos do formulário.
function montarAnimalDoFormulario() {
  return {
    nome: document.getElementById('nome').value,
    datanasc: document.getElementById('datanasc').value,
    removido: document.getElementById('removido').value === 'true'
  };
}
