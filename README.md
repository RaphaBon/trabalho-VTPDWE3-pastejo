# Pastejo Rotacionado — Trabalho DW3

Sistema Cliente-Servidor com CRUD de quatro tabelas relacionadas, que controla o pastejo rotacionado de uma propriedade rural: os pastos são divididos em piquetes, e os animais são alocados nos piquetes por períodos.

- **Pastos** (`pasto`): descrição e área total em hectares.
- **Piquetes** (`piquete`): descrição, latitude, longitude e o pasto a que pertencem.
- **Animais** (`animal`): nome e data de nascimento.
- **Alocações** (`alocado`): o animal, o piquete, a data de início e a data final (vazia = animal ainda no piquete).
- Relações **1:N**: um pasto tem vários piquetes; um piquete tem várias alocações; um animal tem várias alocações. A tabela `alocado` resolve o **N:N** entre animal e piquete.
- Exclusão lógica (soft delete) pelo campo `removido`.
- Login com JWT. Todas as rotas de dados exigem token.

## Regras de negócio

Verificadas no model do backend, antes da gravação. As mensagens chegam no `status` da resposta e o front as mostra em um alerta.

| Regra | Onde | Comportamento |
|---|---|---|
| **R1** Exclusão bloqueada quando o registro está em uso | `DeletePasto`, `DeletePiquete`, `DeleteAnimal` | Não remove um pasto com piquetes ativos, um piquete com alocações ativas nem um animal com alocações ativas. Responde `linhasAfetadas: 0` com a mensagem "Não é possível remover: ...". `DeleteAlocado` não tem verificação. |
| **R2** Um animal não pode estar em dois piquetes no mesmo período | `InsertAlocado`, `UpdateAlocado` | Bloqueia períodos que se sobrepõem a outra alocação ativa do mesmo animal (data final vazia conta como período em aberto). No update, a própria alocação é ignorada. Responde `-1` com "Este animal já está alocado em outro piquete nesse período." |
| **R3** Período invertido | `InsertAlocado`, `UpdateAlocado` + `CHECK` no banco | Data final anterior à data inicial é recusada antes do R2, com "A data final não pode ser anterior à data inicial.". A constraint `ck_alocado_periodo` no banco é a garantia final. |

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Banco | PostgreSQL (extensão `pgcrypto` para as senhas em bcrypt) |
| Backend | Node.js, Express 4, pg, jsonwebtoken, bcryptjs, body-parser, dotenv |
| Frontend | Node.js, Express 5, Nunjucks, dotenv; no navegador: Bootstrap 5, DataTables, Select2 e jQuery (via CDN) |

## Estrutura

```
backend/    API REST (porta 40000)
  apps/login, apps/pastos, apps/animais, apps/piquetes, apps/alocados   (controller + model)
  database/databaseConfig.sql                                          (script do banco)
  routes/router.js
  tests/*.rest                                                         (testes para o REST Client do VS Code)
frontend/   Telas (porta 40100)
  apps/login, apps/home, apps/pastos, apps/animais, apps/piquetes, apps/alocados  (views .njk + .js)
  routes/, views/, public/
```

## 1. Criar o banco

Com o PostgreSQL rodando, crie o banco e execute o script **uma única vez** (executá-lo de novo duplica os pastos, piquetes, animais e alocações):

```bash
psql -h localhost -U postgres -c "CREATE DATABASE pastejo;"
psql -h localhost -U postgres -d pastejo -f backend/database/databaseConfig.sql
```

O script cria as tabelas `pasto`, `piquete`, `animal`, `alocado` e `usuarios` com dados de exemplo.

## 2. Configurar os arquivos .env

Os arquivos reais de configuração não vão para o repositório. Copie os exemplos e ajuste:

```bash
cp backend/.env.example backend/.env
cp frontend/dw3frontend.env.example frontend/dw3frontend.env
```

`backend/.env`:

```
APP_NAME=pastejo_ServidorBackend
SECRET_API=troque_por_um_valor_aleatorio_forte
DB_NAME=pastejo
DB_USER=postgres
DB_PASS=sua_senha_do_postgres
DB_HOST=localhost
DB_PORT=5432
```

- `SECRET_API`: chave usada para assinar o JWT. Pode ser gerada com `openssl rand -base64 48`.
- `DB_HOST=localhost` quando o backend roda com `node app.js` na própria máquina. Se o backend rodar dentro de um container Docker e o banco no host, use `-e DB_HOST=host.docker.internal --add-host=host.docker.internal:host-gateway` no `docker run` (ou `DB_HOST=172.17.0.1`).

`frontend/dw3frontend.env`:

```
APP_NAME=pastejoFrontEnd
PORT=40100
SERVIDOR_DW3=http://localhost:40000
```

## 3. Rodar

Em dois terminais:

```bash
# Backend — http://localhost:40000
cd backend
npm install
node app.js
```

```bash
# Frontend — http://localhost:40100
cd frontend
npm install
node app.js
```

Acesse **http://localhost:40100** e entre com o usuário de teste:

| Usuário | Senha |
|---|---|
| `qwe` | `qwe` |

(também existe `admin` / `admin`). O token expira em 10 minutos.

## APIs do backend

Todas as rotas, exceto `/Login` e `/Logout`, exigem o cabeçalho `Authorization: Bearer <token>`. Sem token válido a resposta é `{ "auth": false, "message": "..." }`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/Login` | Body `{ "username", "password" }` → `{ auth: true, token }` |
| POST | `/Logout` | Encerra a sessão → `{ auth: false, token: null }` |
| GET | `/getAllPastos` | Lista os pastos não removidos, ordenados por descrição |
| GET | `/getPastoByID/:pastoid` | Busca um pasto |
| POST | `/insertPasto` | Inclui um pasto |
| PUT | `/updatePasto/:pastoid` | Altera um pasto |
| DELETE | `/deletePasto/:pastoid` | Remove (lógico) um pasto, se não tiver piquetes ativos (R1) |
| GET | `/getAllAnimais` | Lista os animais não removidos, ordenados por nome |
| GET | `/getAnimalByID/:animalid` | Busca um animal |
| POST | `/insertAnimal` | Inclui um animal |
| PUT | `/updateAnimal/:animalid` | Altera um animal |
| DELETE | `/deleteAnimal/:animalid` | Remove (lógico) um animal, se não tiver alocações ativas (R1) |
| GET | `/getAllPiquetes` | Lista os piquetes não removidos, ordenados por descrição, com o pasto (`descricao`) |
| GET | `/getPiqueteByID/:piqueteid` | Busca um piquete |
| GET | `/getPastosToPiquetes` | Pastos ativos para o select do formulário de piquetes |
| POST | `/insertPiquete` | Inclui um piquete |
| PUT | `/updatePiquete/:piqueteid` | Altera um piquete |
| DELETE | `/deletePiquete/:piqueteid` | Remove (lógico) um piquete, se não tiver alocações ativas (R1) |
| GET | `/getAllAlocados` | Lista as alocações não removidas, ordenadas por data de início, com o animal (`nome`) e o piquete (`descricao`) |
| GET | `/getAlocadoByID/:alocadoid` | Busca uma alocação |
| GET | `/getAnimaisToAlocados` | Animais ativos para o select do formulário de alocações |
| GET | `/getPiquetesToAlocados` | Piquetes ativos para o select do formulário de alocações |
| POST | `/insertAlocado` | Inclui uma alocação (`datafinal` vazia grava NULL; aplica R3 e R2) |
| PUT | `/updateAlocado/:alocadoid` | Altera uma alocação (`datafinal` vazia grava NULL; aplica R3 e R2) |
| DELETE | `/deleteAlocado/:alocadoid` | Remove (lógico) uma alocação |

Respostas: buscas retornam `{ status: "ok", registro: [...] }`; inclusões, alterações e remoções retornam `{ status, linhasAfetadas }` (em caso de erro, `status` traz a mensagem do banco ou da regra de negócio e `linhasAfetadas` é `-1`; na remoção bloqueada pelo R1, `linhasAfetadas` é `0`).

Exemplos de requisições prontas estão em `backend/tests/` (extensão REST Client do VS Code).
