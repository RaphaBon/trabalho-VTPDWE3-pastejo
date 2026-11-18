// Listagem de pastos: busca na API e monta o DataTable.
document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('pastosListagem');
  var alertBox = document.getElementById('pastosAlert');

  if (!listagem) {
    return;
  }

  var servidorDw3 = listagem.dataset.servidorDw3;

  configurarOperacoesPastos(alertBox);
  carregarPastos(servidorDw3, alertBox);
});

// GET /getAllPastos.
async function carregarPastos(servidorDw3, alertBox) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    // Envia o token no Authorization.
    var response = await fetch(servidorDw3 + '/getAllPastos', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a lista de pastos.');
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

    inicializarTabelaPastos(data.registro);
  } catch (error) {
    exibirErro(alertBox, error.message || 'Erro ao carregar pastos.');
    inicializarTabelaPastos([]);
  }
}

// Cria o DataTable; columns liga cada coluna a um campo.
function inicializarTabelaPastos(pastos) {
  new DataTable('#tblPastos', {
    data: pastos,
    columns: [
      { data: 'pastoid', defaultContent: '' },
      { data: 'descricao', defaultContent: '' },
      {
        data: 'areatotal',
        defaultContent: '',
        // Formata em ha.
        render: function(data) {
          if (data === null || data === undefined || data === '') {
            return '';
          }

          return Number(data).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) + ' ha';
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

          var pastoId = escaparHtml(row.pastoid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operacoes do pasto">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-pastoid="' + pastoId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-pastoid="' + pastoId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-pastoid="' + pastoId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum pasto cadastrado.',
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
function configurarOperacoesPastos(alertBox) {
  var tabela = document.getElementById('tblPastos');

  if (!tabela) {
    return;
  }

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-pastoid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var pastoId = botao.dataset.pastoid;

    if (action === 'visualizar') {
      window.location.href = '/pastos/form?oper=Re&pastoId=' + encodeURIComponent(pastoId);
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/pastos/form?oper=Up&pastoId=' + encodeURIComponent(pastoId);
      return;
    }

    if (action === 'remover') {
      window.location.href = '/pastos/form?oper=De&pastoId=' + encodeURIComponent(pastoId);
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
