// Listagem de alocações: busca na API e monta o DataTable.
document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('alocadosListagem');
  var alertBox = document.getElementById('alocadosAlert');

  if (!listagem) {
    return;
  }

  var servidorDw3 = listagem.dataset.servidorDw3;

  configurarOperacoesAlocados(alertBox);
  carregarAlocados(servidorDw3, alertBox);
});

// GET /getAllAlocados.
async function carregarAlocados(servidorDw3, alertBox) {
  try {
    if (!servidorDw3) {
      throw new Error('Endereco do servidor backend nao configurado.');
    }

    // Envia o token no Authorization.
    var response = await fetch(servidorDw3 + '/getAllAlocados', {
      headers: dw3MontarHeadersAutenticacao()
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a lista de alocações.');
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

    inicializarTabelaAlocados(data.registro);
  } catch (error) {
    exibirErro(alertBox, error.message || 'Erro ao carregar alocações.');
    inicializarTabelaAlocados([]);
  }
}

// Cria o DataTable; columns liga cada coluna a um campo.
function inicializarTabelaAlocados(alocados) {
  new DataTable('#tblAlocados', {
    data: alocados,
    columns: [
      { data: 'alocadoid', defaultContent: '' },
      { data: 'animal', defaultContent: '' },
      { data: 'piquete', defaultContent: '' },
      {
        data: 'datainicio',
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
        data: 'datafinal',
        defaultContent: '',
        // Sem data final = animal ainda no piquete.
        render: function(data) {
          if (!data) {
            return 'Em andamento';
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

          var alocadoId = escaparHtml(row.alocadoid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operacoes da alocação">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-alocadoid="' + alocadoId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-alocadoid="' + alocadoId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-alocadoid="' + alocadoId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhuma alocação cadastrada.',
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
function configurarOperacoesAlocados(alertBox) {
  var tabela = document.getElementById('tblAlocados');

  if (!tabela) {
    return;
  }

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-alocadoid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var alocadoId = botao.dataset.alocadoid;

    if (action === 'visualizar') {
      window.location.href = '/alocados/form?oper=Re&alocadoId=' + encodeURIComponent(alocadoId);
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/alocados/form?oper=Up&alocadoId=' + encodeURIComponent(alocadoId);
      return;
    }

    if (action === 'remover') {
      window.location.href = '/alocados/form?oper=De&alocadoId=' + encodeURIComponent(alocadoId);
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
