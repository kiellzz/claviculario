# Endpoints Utilizados pelo Painel Frontend

## Autenticação

### Obter Token JWT

```http
POST /api/auth/token/
```

### Renovar Token JWT

```http
POST /api/auth/token/refresh/
```

---

## Usuários

### Listar Usuários

```http
GET /api/usuarios/
```

### Cadastrar Usuário

```http
POST /api/usuarios/
```

### Atualizar Usuário

```http
PUT /api/usuarios/{id}/
```

### Remover Usuário

```http
DELETE /api/usuarios/{id}/
```

---

## Turmas

### Listar Turmas

```http
GET /api/turmas/
```

---

## Salas

### Listar Salas

```http
GET /api/salas/
```

### Cadastrar Sala

```http
POST /api/salas/
```

---

## Chaves

### Listar Chaves

```http
GET /api/chaves/
```

### Cadastrar Chave

```http
POST /api/chaves/
```

---

## Autorizações

### Listar Autorizações

```http
GET /api/autorizacoes/
```

### Criar Autorização

```http
POST /api/autorizacoes/
```

---

## Eventos

### Listar Eventos

```http
GET /api/eventos/
```

---

## Empréstimos

### Listar Empréstimos

```http
GET /api/emprestimos/
```

---

## Timetable

### Listar Horários

```http
GET /api/timetable/
```

### Cadastrar Horário

```http
POST /api/timetable/
```

---

## Operações

### Retirada de Chave

```http
POST /api/operacoes/retirada/
```

Responsável por registrar a retirada de uma chave autorizada.

### Devolução de Chave

```http
POST /api/operacoes/devolucao/
```

Responsável por registrar a devolução de uma chave.

### Acionamento de Pânico

```http
POST /api/operacoes/panico/
```

Responsável por registrar eventos de emergência.

---

## Relatórios

### Consultar Relatórios

```http
GET /api/relatorios/
```

Permite visualizar informações consolidadas do sistema.

---

## WebSocket

### Eventos em Tempo Real

```text
ws://localhost:8000/ws/eventos/
```

Canal utilizado para atualização automática de eventos no painel administrativo.

---

## Observação

Todos os endpoints protegidos exigem um token JWT válido no cabeçalho da requisição:

```http
Authorization: Bearer <token>
```