# CLAVICULÁRIO AUTOMATIZADO – REQUISITOS E ARQUITETURA DO BACKEND/CLOUD

**Subgrupo:** Back-end e Nuvem  
**Stack Principal:** Django · PostgreSQL · Docker  
**Padrão de referência:** IEEE 830 (REQUISITOS.md)  
**Versão:** 1.0

---

## 1. ESCOPO DO SUBGRUPO

O backend é o coração do sistema: recebe eventos do firmware (Arduino/ESP32), aplica as regras de negócio (autorização, hierarquia, timetable), persiste tudo no banco, expõe a API REST para o dashboard e o app mobile, e envia eventos em tempo real para a interface do porteiro (alerta de pânico, mudança de status de chave).

**RFs de responsabilidade direta:**

| RF | Descrição resumida |
|----|--------------------|
| RF-02 | Associar RFID a matrícula e papel |
| RF-03 | Cadastro de usuários na nuvem |
| RF-12 | Validar autorização antes de liberar chave |
| RF-13 | Registrar retirada (quem, sala, data, hora) |
| RF-14 | Registrar devolução e acionar braço (via MQTT/HTTP para firmware) |
| RF-15 | Bloquear chave já emprestada |
| RF-16 | Regra: professor só pega dentro do horário |
| RF-17 | Regra: aluno só pega se autorizado pela coordenação |
| RF-18 | Coordenação autoriza aluno específico (com validade) |
| RF-19 | Coordenação autoriza professor fora do horário (com validade) |
| RF-20 | Log completo de retiradas/devoluções para a coordenação |
| RF-21 | Status atual das chaves para o porteiro |
| RF-25 | Carregar timetable a partir de arquivo JSON mock |
| RF-26 | *(Desejável)* Web scraping do timetable real |
| RF-27 | Coordenação edita autorizações temporárias |
| RF-30 | API de autorização para o dashboard |
| RF-31 | API de relatórios por período |
| RF-35 | Persistir todos os eventos com timestamp |
| RF-36 | Histórico por chave ou usuário |
| RF-37 | Sincronizar estado dos slots em near real-time |

**RNFs de responsabilidade direta:**

| RNF | Descrição |
|-----|-----------|
| RNF-02 | Disponibilidade 99% (7h–22h) |
| RNF-03 | HTTPS + criptografia básica em repouso |
| RNF-04 | LGPD: sem biometria/imagens, apenas matrícula/nome/papel/eventos |

---

## 2. STACK RECOMENDADA (COM JUSTIFICATIVAS)

### 2.1 Stack Principal

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Framework web** | Django 5.x + Django REST Framework | Batteries-included, ORM robusto, admin gratuito (útil para cadastros rápidos), ecossistema maduro |
| **WebSocket / Tempo real** | Django Channels + Redis (channel layer) | Necessário para RF-29/RF-37: alertas de pânico e sincronização de status em tempo real sem polling |
| **Banco de dados** | PostgreSQL 16 | ACID, suporte a JSONB (útil para eventos), consultas de intervalo de tempo nativas (ideal para timetable) |
| **Cache / Broker** | Redis 7 | Atua como channel layer do Channels E como broker do Celery |
| **Tarefas assíncronas** | Celery + Redis | Notificações de atraso de devolução (RN-05), scraping do timetable (RF-26), envio de alertas |
| **Containerização** | Docker + Docker Compose | Ambiente reproduzível para todos os subgrupos; facilita deploy |
| **Autenticação** | SimpleJWT (djangorestframework-simplejwt) | JWT stateless, sem sessão — ideal para firmware + dashboard + mobile |
| **Comunicação com Firmware** | REST (HTTP/HTTPS) + MQTT via broker Mosquitto | O ESP32 faz POST de eventos; o backend publica comandos de movimento via MQTT |

### 2.2 Sugestões de Deploy (dentro do orçamento R$ 0)

| Opção | O que oferece gratuitamente | Indicado para |
|-------|---------------------------|---------------|
| **Railway** | PostgreSQL + Web Service + Redis | Deploy mais simples, recomendado para a PoC |
| **Render** | PostgreSQL + Web Service | Alternativa ao Railway |
| **Fly.io** | Containers Docker com mais controle | Se a equipe já tiver familiaridade com Docker |

> ⚠️ **Evite Firebase como banco principal.** Dado que já foi escolhido PostgreSQL + Django, o Firebase Realtime Database criaria duplicidade. Se quiser notificações push no mobile futuramente, use Firebase apenas como FCM (push notifications), não como store de dados.

---

## 3. MODELAGEM DO BANCO DE DADOS

### 3.1 Entidades Principais

```
Usuario
  - id (UUID)
  - matricula (CharField, unique)
  - nome (CharField)
  - papel (ENUM: professor | aluno | porteiro | coordenacao)
  - rfid_tag (CharField, unique) ← hash da tag, não o UID bruto
  - ativo (Boolean)
  - criado_em (DateTime)

Sala
  - id (UUID)
  - codigo (CharField, unique)  ← ex: "301A"
  - andar (IntegerField)
  - descricao (CharField)

Chave
  - id (UUID)
  - sala (FK → Sala)
  - rfid_tag (CharField, unique)  ← tag RFID colada na chave
  - slot_x (IntegerField)         ← coordenada física no claviculário
  - slot_y (IntegerField)
  - status (ENUM: disponivel | emprestada | em_transito)

Evento
  - id (UUID)
  - tipo (ENUM: retirada | devolucao | panico | autorizacao)
  - usuario (FK → Usuario, nullable)
  - chave (FK → Chave, nullable)
  - sala (FK → Sala, nullable)
  - timestamp (DateTimeField, auto)
  - detalhes (JSONField)  ← dados extras (ex: slot destino, origem do pânico)

Autorizacao
  - id (UUID)
  - usuario (FK → Usuario)
  - sala (FK → Sala, nullable)   ← null = acesso a qualquer sala
  - concedida_por (FK → Usuario) ← deve ser coordenação
  - valida_de (DateTime)
  - valida_ate (DateTime, nullable)  ← null = sem expiração
  - ativa (Boolean)

Timetable
  - id (UUID)
  - professor (FK → Usuario)
  - sala (FK → Sala)
  - dia_semana (IntegerField)  ← 0=seg ... 6=dom
  - hora_inicio (TimeField)
  - hora_fim (TimeField)
  - vigencia_inicio (DateField)
  - vigencia_fim (DateField, nullable)
```

### 3.2 Índices Recomendados

- `Evento(timestamp)` — relatórios por período (RF-31)
- `Evento(chave_id, timestamp)` — histórico por chave (RF-36)
- `Evento(usuario_id, timestamp)` — histórico por usuário (RF-36)
- `Autorizacao(usuario_id, ativa)` — verificação de autorização em tempo real (RF-12)
- `Timetable(professor_id, dia_semana)` — validação de horário (RF-16)

---

## 4. ARQUITETURA DE SERVIÇOS

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                         │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │   Django     │   │  PostgreSQL  │   │     Redis     │  │
│  │  (ASGI –     │◄──│     16       │   │  (cache +     │  │
│  │  Daphne/     │   │              │   │   broker)     │  │
│  │  Uvicorn)    │   └──────────────┘   └───────┬───────┘  │
│  │              │                              │           │
│  │  REST API    │   ┌──────────────┐           │           │
│  │  WebSocket   │   │   Celery     │◄──────────┘           │
│  │  Admin       │   │   Worker     │                       │
│  └──────┬───────┘   └──────────────┘                       │
│         │                                                   │
│  ┌──────┴───────┐   ┌──────────────┐                       │
│  │  Mosquitto   │   │   Nginx      │                       │
│  │  (MQTT       │   │  (reverse    │                       │
│  │   broker)    │   │   proxy)     │                       │
│  └──────────────┘   └──────────────┘                       │
└──────────┬──────────────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────┐
    │  Clientes externos              │
    │  · ESP32/Arduino (MQTT + REST)  │
    │  · Dashboard React/Vue          │
    │  · App Mobile Flutter/PWA       │
    └─────────────────────────────────┘
```

---

## 5. ENDPOINTS DA API REST

### Autenticação

| Método | Endpoint | Descrição | Papel |
|--------|----------|-----------|-------|
| POST | `/api/auth/token/` | Login (retorna JWT) | Todos |
| POST | `/api/auth/token/refresh/` | Renovar token | Todos |

### Usuários

| Método | Endpoint | Descrição | Papel |
|--------|----------|-----------|-------|
| GET | `/api/usuarios/` | Listar usuários | Coordenação |
| POST | `/api/usuarios/` | Cadastrar usuário | Coordenação |
| GET | `/api/usuarios/{id}/` | Detalhe | Coordenação |
| PATCH | `/api/usuarios/{id}/` | Editar | Coordenação |

### Chaves e Slots

| Método | Endpoint | Descrição | Papel |
|--------|----------|-----------|-------|
| GET | `/api/chaves/` | Status de todas as chaves | Porteiro, Coordenação |
| GET | `/api/chaves/{id}/` | Detalhe + histórico | Coordenação |

### Operações (Firmware chama estes endpoints)

| Método | Endpoint | Descrição | Quem chama |
|--------|----------|-----------|------------|
| POST | `/api/operacoes/retirada/` | Solicitar chave (valida RFID + autorização) | Firmware (ESP32) |
| POST | `/api/operacoes/devolucao/` | Registrar devolução (RFID da chave) | Firmware (ESP32) |
| POST | `/api/operacoes/panico/` | Acionar alerta de pânico | Firmware (ESP32) ou Mobile |

**Payload de `/api/operacoes/retirada/`:**
```json
{
  "rfid_usuario": "A1B2C3D4",
  "codigo_sala": "301A"
}
```

**Resposta de sucesso:**
```json
{
  "autorizado": true,
  "chave_id": "uuid-...",
  "slot_x": 3,
  "slot_y": 1,
  "mensagem": "Chave liberada. Braço se movendo."
}
```

### Autorizações

| Método | Endpoint | Descrição | Papel |
|--------|----------|-----------|-------|
| GET | `/api/autorizacoes/` | Listar autorizações ativas | Coordenação |
| POST | `/api/autorizacoes/` | Criar autorização | Coordenação |
| DELETE | `/api/autorizacoes/{id}/` | Revogar autorização | Coordenação |

### Timetable

| Método | Endpoint | Descrição | Papel |
|--------|----------|-----------|-------|
| GET | `/api/timetable/` | Listar grade horária | Coordenação |
| POST | `/api/timetable/importar/` | Importar JSON mock | Coordenação |

### Relatórios

| Método | Endpoint | Descrição | Papel |
|--------|----------|-----------|-------|
| GET | `/api/relatorios/eventos/?de=&ate=&sala=` | Eventos por filtro | Coordenação |
| GET | `/api/relatorios/chave/{id}/historico/` | Histórico de uma chave | Coordenação |
| GET | `/api/relatorios/usuario/{id}/historico/` | Histórico de um usuário | Coordenação |

---

## 6. WEBSOCKET (TEMPO REAL)

Usando **Django Channels**. O dashboard conecta via WebSocket para receber eventos sem polling.

**Endpoint:** `wss://<host>/ws/eventos/`

**Mensagens emitidas pelo servidor:**

```json
// Alerta de pânico
{ "tipo": "panico", "sala": "301A", "andar": 3, "timestamp": "2025-06-01T14:32:00Z" }

// Mudança de status de chave
{ "tipo": "status_chave", "sala": "301A", "status": "emprestada", "usuario": "Prof. João" }

// Notificação de atraso de devolução
{ "tipo": "atraso_devolucao", "sala": "301A", "usuario": "Prof. João", "minutos_atraso": 35 }
```

---

## 7. REGRAS DE NEGÓCIO (IMPLEMENTAÇÃO)

### RF-12 / RN-01 / RN-02 – Validação de autorização

```python
def verificar_autorizacao(usuario, sala, timestamp_agora):
    # 1. Coordenação sempre pode
    if usuario.papel == 'coordenacao':
        return True, "Coordenação autorizada"

    # 2. Verificar autorização manual ativa
    autorizacao = Autorizacao.objects.filter(
        usuario=usuario,
        sala__in=[sala, None],  # None = qualquer sala
        ativa=True,
        valida_de__lte=timestamp_agora,
    ).filter(
        Q(valida_ate__isnull=True) | Q(valida_ate__gte=timestamp_agora)
    ).first()
    if autorizacao:
        return True, "Autorização manual válida"

    # 3. Professor: verificar timetable
    if usuario.papel == 'professor':
        dia = timestamp_agora.weekday()
        hora = timestamp_agora.time()
        entrada = Timetable.objects.filter(
            professor=usuario,
            sala=sala,
            dia_semana=dia,
            hora_inicio__lte=hora,
            hora_fim__gte=hora,
        ).exists()
        if entrada:
            return True, "Dentro do horário de aula"

    # 4. Aluno sem autorização = bloqueado (RN-03)
    return False, "Sem autorização para retirar esta chave"
```

### RN-04 – Chave única por sala

Verificar `Chave.status != 'emprestada'` antes de liberar. Usar transação com `select_for_update()` para evitar race condition.

### RN-05 – Notificação de atraso (Celery)

```python
# Tarefa agendada a cada 5 minutos
@shared_task
def verificar_atrasos():
    emprestadas = Chave.objects.filter(status='emprestada')
    for chave in emprestadas:
        ultimo_evento = Evento.objects.filter(
            chave=chave, tipo='retirada'
        ).latest('timestamp')
        # Lógica: buscar fim da aula no timetable e comparar com agora
        ...
```

---

## 8. COMUNICAÇÃO COM O FIRMWARE (ESP32)

O firmware pode se comunicar com o backend por dois protocolos:

| Canal | Quando usar | Exemplo |
|-------|------------|---------|
| **REST (HTTP POST)** | Eventos pontuais (retirada, devolução, pânico) | ESP32 faz `POST /api/operacoes/retirada/` |
| **MQTT** | Comandos de movimento para o braço (backend → firmware) | Backend publica em `claviculario/braço/mover` com `{x:3, y:1, acao:"pegar"}` |

### Tópicos MQTT sugeridos

| Tópico | Direção | Conteúdo |
|--------|---------|---------|
| `claviculario/braco/mover` | Backend → ESP32 | `{x, y, acao: "pegar"\|"depositar"}` |
| `claviculario/braco/status` | ESP32 → Backend | `{estado: "idle"\|"movendo"\|"erro"}` |
| `claviculario/slot/status` | ESP32 → Backend | `{x, y, ocupado: true\|false}` |
| `claviculario/panico` | ESP32 → Backend | `{sala: "301A", andar: 3}` |

---

## 9. ESTRUTURA DO PROJETO DJANGO

```
claviculario_backend/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env.example
├── manage.py
└── apps/
    ├── usuarios/          # RF-02, RF-03
    │   ├── models.py
    │   ├── serializers.py
    │   └── views.py
    ├── chaves/            # RF-04, RF-09, RF-15
    │   ├── models.py
    │   └── views.py
    ├── operacoes/         # RF-12, RF-13, RF-14, RF-16, RF-17
    │   ├── services.py    ← regras de negócio aqui (não nas views)
    │   ├── tasks.py       ← Celery tasks (RN-05)
    │   └── views.py
    ├── autorizacoes/      # RF-18, RF-19, RF-27
    │   ├── models.py
    │   └── views.py
    ├── timetable/         # RF-25, RF-26
    │   ├── models.py
    │   ├── importador.py  ← lê JSON mock
    │   └── scraper.py     ← (desejável) scraping real
    ├── relatorios/        # RF-20, RF-31, RF-36
    │   └── views.py
    ├── eventos/           # RF-35, RF-37
    │   ├── models.py
    │   └── consumers.py   ← WebSocket (Django Channels)
    └── mqtt/              # Comunicação com firmware
        ├── client.py      ← publica comandos MQTT
        └── listener.py    ← consome eventos do ESP32 via MQTT
```

---

## 10. DOCKER COMPOSE (EXEMPLO BASE)

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: claviculario
      POSTGRES_USER: claviculario
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

  web:
    build: .
    command: daphne -b 0.0.0.0 -p 8000 claviculario_backend.asgi:application
    environment:
      DATABASE_URL: postgres://claviculario:${DB_PASSWORD}@db/claviculario
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis
    ports:
      - "8000:8000"

  celery:
    build: .
    command: celery -A claviculario_backend worker -l info -B
    environment:
      DATABASE_URL: postgres://claviculario:${DB_PASSWORD}@db/claviculario
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - web

volumes:
  postgres_data:
```

---

## 11. SEGURANÇA E LGPD

| Medida | Implementação |
|--------|---------------|
| HTTPS obrigatório | Nginx com certificado (Let's Encrypt no deploy, auto-assinado no dev) |
| JWT com expiração curta | Access token: 15min / Refresh token: 7 dias |
| RFID: armazenar hash | `hashlib.sha256(rfid_uid.encode()).hexdigest()` — nunca o UID bruto |
| Permissões por papel | DRF `IsAuthenticated` + permissões customizadas por papel |
| Sem dados sensíveis | Apenas matrícula, nome, papel e eventos (conformidade LGPD/RNF-04) |
| Auditoria | Todo acesso à API de operações gera um `Evento` — não há ação silenciosa |

---

## 12. CRITÉRIOS DE ACEITE DO BACKEND (alinhados à PoC)

| # | Critério | RF/RN relacionado |
|---|----------|-----------------|
| 1 | `POST /api/operacoes/retirada/` retorna `autorizado: true` para professor com aula no horário | RF-12, RN-01 |
| 2 | Mesma rota retorna `autorizado: false` para aluno sem autorização | RF-17, RN-03 |
| 3 | Evento de retirada é persistido no banco com timestamp | RF-13, RF-35 |
| 4 | Dashboard recebe mensagem WebSocket em < 1s após acionamento do pânico | RF-23, RF-29, RF-37 |
| 5 | Coordenação cria autorização via `POST /api/autorizacoes/` e professor passa a ser autorizado fora do horário | RF-18, RF-19, RN-02 |
| 6 | Chave com status `emprestada` não pode ser retirada por segundo usuário | RF-15, RN-04 |
| 7 | Relatório de eventos filtrável por período retorna dados corretos | RF-31 |
| 8 | Timetable importado via JSON mock é consultado corretamente na validação | RF-25 |

---

## 13. PRÓXIMOS PASSOS DO SUBGRUPO

- [ ] Configurar repositório Git com branch por módulo (`feat/usuarios`, `feat/operacoes`, etc.)
- [ ] Subir `docker-compose.yml` base com DB + Redis para todos os membros
- [ ] Implementar modelos e migrations
- [ ] Implementar `POST /api/operacoes/retirada/` com toda a regra de negócio (maior prioridade)
- [ ] Implementar WebSocket do alerta de pânico (integração com frontend)
- [ ] Importar JSON mock do timetable
- [ ] Definir com o subgrupo de firmware o contrato MQTT (tópicos e payloads)
- [ ] Configurar deploy no Railway (ambiente de homologação)
- [ ] *(Desejável)* Implementar scraper do timetable real

---

*Documento gerado com base em PROJECT_DESCRIPTION.md e REQUISITOS.md (IEEE 830).*
