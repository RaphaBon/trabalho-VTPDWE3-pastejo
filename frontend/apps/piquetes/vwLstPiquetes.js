// Listagem de piquetes: busca na API e monta o DataTable.
document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('piquetesListagem');
  var alertBox = document.getElementById('piquetesAlert');

  if (!listagem) {
    return;
  }

  var servidorDw3 = listagem.dataset.servidorDw3;

  configurarOperacoesPiquetes(alertBox);
  carregarPiquetes(servidorDw3, alertBox);
});

// GET /getAllPiquetes.
async function carregarPiquetes(servidorDw3, alertBox) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    // Envia o token no Authorization.
    var response = await fetch(servidorDw3 + '/getAllPiquetes', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a lista de piquetes.');
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

    inicializarTabelaPiquetes(data.registro);
  } catch (error) {
    exibirErro(alertBox, error.message || 'Erro ao carregar piquetes.');
    inicializarTabelaPiquetes([]);
  }
}

// Cria o DataTable; columns liga cada coluna a um campo.
function inicializarTabelaPiquetes(piquetes) {
  new DataTable('#tblPiquetes', {
    data: piquetes,
    columns: [
      { data: 'piqueteid', defaultContent: '' },
      { data: 'descricao', defaultContent: '' },
      {
        data: 'latitude',
        defaultContent: '',
        // Formata com 6 casas decimais.
        render: function(data) {
          if (data === null || data === undefined || data === '') {
            return '';
          }

          return Number(data).toLocaleString('pt-BR', {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6
          });
        }
      },
      {
        data: 'longitude',
        defaultContent: '',
        // Formata com 6 casas decimais.
        render: function(data) {
          if (data === null || data === undefined || data === '') {
            return '';
          }

          return Number(data).toLocaleString('pt-BR', {
            minimumFractionDigits: 6,
            maximumFractionDigits: 6
          });
        }
      },
      { data: 'pasto', defaultContent: '' },
      {
        data: null,
        orderable: false,
        searchable: false,
        // Botões visualizar, atualizar e remover.
        render: function(data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var piqueteId = escaparHtml(row.piqueteid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operacoes do piquete">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-piqueteid="' + piqueteId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-piqueteid="' + piqueteId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-piqueteid="' + piqueteId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum piquete cadastrado.',
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
function configurarOperacoesPiquetes(alertBox) {
  var tabela = document.getElementById('tblPiquetes');

  if (!tabela) {
    return;
  }

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-piqueteid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var piqueteId = botao.dataset.piqueteid;

    if (action === 'visualizar') {
      window.location.href = '/piquetes/form?oper=Re&piqueteId=' + encodeURIComponent(piqueteId);
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/piquetes/form?oper=Up&piqueteId=' + encodeURIComponent(piqueteId);
      return;
    }

    if (action === 'remover') {
      window.location.href = '/piquetes/form?oper=De&piqueteId=' + encodeURIComponent(piqueteId);
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
