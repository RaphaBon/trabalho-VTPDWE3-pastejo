// Listagem de animais: busca na API e monta o DataTable.
document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('animaisListagem');
  var alertBox = document.getElementById('animaisAlert');

  if (!listagem) {
    return;
  }

  var servidorDw3 = listagem.dataset.servidorDw3;

  configurarOperacoesAnimais(alertBox);
  carregarAnimais(servidorDw3, alertBox);
});

// GET /getAllAnimais.
async function carregarAnimais(servidorDw3, alertBox) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    // Envia o token no Authorization.
    var response = await fetch(servidorDw3 + '/getAllAnimais', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a lista de animais.');
    }

    var data = await response.json();

    // Token inválido ou expirado: volta ao login.
    if (data.auth === false) {
      dw3SessaoExpirada(data.message || 'Sessao expirada. Faca login novamente.');
      return;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error('Resposta invalida do servidor backend.');
    }

    inicializarTabelaAnimais(data.registro);
  } catch (error) {
    exibirErro(alertBox, error.message || 'Erro ao carregar animais.');
    inicializarTabelaAnimais([]);
  }
}

// Cria o DataTable; columns liga cada coluna a um campo.
function inicializarTabelaAnimais(animais) {
  new DataTable('#tblAnimais', {
    data: animais,
    columns: [
      { data: 'animalid', defaultContent: '' },
      { data: 'nome', defaultContent: '' },
      {
        data: 'datanasc',
        defaultContent: '',
        // AAAA-MM-DD -> dd/mm/aaaa.
        render: function(data) {
          if (!data) {
            return '';
          }

          return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        // Botões visualizar, atualizar e remover.
        render: function(data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var animalId = escaparHtml(row.animalid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operacoes do animal">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-animalid="' + animalId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-animalid="' + animalId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-animalid="' + animalId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum animal cadastrado.',
      info: 'Mostrando _START_ ate _END_ de _TOTAL_ registros',
      infoEmpty: 'Mostrando 0 ate 0 de 0 registros',
      infoFiltered: '(filtrado de _MAX_ registros no total)',
      lengthMenu: 'Mostrar _MENU_ registros',
      loadingRecords: 'Carregando...',
      processing: 'Processando...',
      search: 'Pesquisar:',
      zeroRecords: 'Nenhum registro encontrado',
      paginate: {
        first: 'Primeiro',
        last: 'Ultimo',
        next: 'Proximo',
        previous: 'Anterior'
      }
    }
  });
}

// Abre o formulário com a oper do botão clicado (Re, Up, De).
function configurarOperacoesAnimais(alertBox) {
  var tabela = document.getElementById('tblAnimais');

  if (!tabela) {
    return;
  }

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-animalid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var animalId = botao.dataset.animalid;

    if (action === 'visualizar') {
      window.location.href = '/animais/form?oper=Re&animalId=' + encodeURIComponent(animalId);
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/animais/form?oper=Up&animalId=' + encodeURIComponent(animalId);
      return;
    }

    if (action === 'remover') {
      window.location.href = '/animais/form?oper=De&animalId=' + encodeURIComponent(animalId);
    }
  });
}

function exibirAviso(alertBox, mensagem) {
  if (!alertBox) {
    return;
  }

  alertBox.textContent = mensagem;
  alertBox.classList.remove('alert-danger');
  alertBox.classList.add('alert-info');
  alertBox.classList.remove('d-none');
}

// Evita que o valor vire HTML.
function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function exibirErro(alertBox, mensagem) {
  if (!alertBox) {
    return;
  }

  alertBox.textContent = mensagem;
  alertBox.classList.remove('alert-info');
  alertBox.classList.add('alert-danger');
  alertBox.classList.remove('d-none');
}
