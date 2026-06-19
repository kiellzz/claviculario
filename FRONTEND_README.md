# FRONTEND_README.md

````md
# Painel Frontend de Testes - Claviculário Automatizado

## Descrição

O Painel Frontend de Testes foi desenvolvido para facilitar a validação e demonstração das funcionalidades do backend do sistema Claviculário Automatizado sem a necessidade de utilizar ferramentas externas como Postman ou Insomnia.

Através da interface web é possível realizar autenticação, consultar dados cadastrados, executar operações e visualizar informações retornadas pela API.

---

## Funcionalidades

- Login utilizando JWT
- Dashboard de informações
- Consulta de usuários
- Consulta de salas
- Consulta de chaves
- Consulta de autorizações
- Consulta de eventos
- Consulta de empréstimos
- Consulta de horários (Timetable)
- Teste de retirada de chaves
- Teste de devolução de chaves
- Consulta de relatórios
- Comunicação com API REST
- Atualização de eventos em tempo real via WebSocket

---

## Estrutura

```text
core/
├── templates/
│   └── core/
│       └── painel.html
│
├── static/
│   └── core/
│       ├── admin_panel.css
│       └── admin_panel.js
````

---

## Requisitos

* Python 3.12
* Django 5.2
* Navegador Web atualizado
* Backend em execução

---

## Configuração

Criar um arquivo `.env` na raiz do projeto:

```env
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
FRONTEND_API_BASE_URL=http://127.0.0.1:8000
```

---

## Executando o Projeto

Instalar dependências:

```bash
uv sync
```

Executar servidor:

```bash
uv run python manage.py runserver
```

---

## Acesso

Abrir no navegador:

```text
http://127.0.0.1:8000/painel/
```

---

## Fluxo de Utilização

1. Acessar o painel.
2. Informar URL da API.
3. Realizar login.
4. Obter token JWT.
5. Navegar pelas funcionalidades disponíveis.
6. Executar consultas e operações.
7. Visualizar respostas retornadas pelo backend.

---

## Objetivo Acadêmico

Este painel foi desenvolvido exclusivamente para fins acadêmicos e de validação do backend do projeto Claviculário Automatizado, servindo como ambiente de testes para as funcionalidades implementadas pela equipe.

---

## Autor

Integrante 7 – Frontend Visual de Testes e Painel Administrativo.