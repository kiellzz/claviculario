
---

## DOCUMENTO DE REQUISITOS – VERSÃO IEEE 830 (CORRIGIDA E SIMPLIFICADA)

---

# 1. Introdução

## 1.1. Propósito
Este documento especifica os requisitos do sistema **Claviculário Automatizado** – uma prova de conceito (PoC) para automatizar o controle de chaves e itens de salas de aula, com registro em nuvem, hierarquia de usuários e botão de pânico. **Não inclui fechaduras elétricas nem controle físico de acesso a portas.**

## 1.2. Escopo do Produto
- **Dentro do escopo:** Claviculário físico com braço móvel, identificação por RFID, back-end na nuvem, dashboard web, app mobile (desejável), botão de pânico, integração com timetable (desejável).
- **Fora do escopo:** Fechaduras elétricas, câmeras, biometria, controle físico de entrada/saída de alunos, registro de presença de alunos em sala.

## 1.3. Definições, Acrônimos e Abreviações
- **Claviculário** – Estrutura com slots/ganchos para armazenar chaves.
- **PoC** – Prova de Conceito.
- **RFID** – Identificação por radiofrequência.
- **Timetable** – Grade de horários das aulas.

---

# 2. Descrição Geral

## 2.1. Perspectiva do Produto
O sistema é independente, mas pode futuramente integrar-se ao sistema de timetable existente via scraping. Opera em ambiente de laboratório (PoC), não em produção.

## 2.2. Funções do Produto (resumo)
- Automatizar retirada e devolução de chaves via claviculário com braço móvel.
- Identificar usuários via RFID (crachás adaptados).
- Registrar todos os eventos em nuvem.
- Fornecer dashboard para porteiro e coordenação.
- Acionar alerta de pânico.
- Permitir autorizações excepcionais pela coordenação.

## 2.3. Características dos Usuários
| Usuário | Papel | Conhecimento |
|---------|-------|--------------|
| Professor | Retira chaves | Baixo (interface simples) |
| Aluno | **Não interage diretamente com o sistema** (exceto se autorizado pela coordenação) | N/A |
| Porteiro | Visualiza status e alertas | Baixo |
| Coordenação | Autoriza, vê relatórios | Médio |

---

# 3. Requisitos Específicos (IEEE 830)

## 3.1. Requisitos Funcionais (RF)

### Módulo 1: Identificação e Autenticação

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-01 | O sistema deve permitir que cada usuário (professor, funcionário, coordenação) se identifique através de etiqueta RFID/NFC colada no crachá existente. | Alta |
| RF-02 | O sistema deve associar cada etiqueta RFID a um número de matrícula e a um papel (professor, coordenação, porteiro, aluno-excepcional). | Alta |
| RF-03 | O sistema deve manter um cadastro de usuários (nome, matrícula, papel) na nuvem. | Alta |

### Módulo 2: Claviculário Físico (Braço Móvel)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-04 | O claviculário deve conter uma matriz de slots (ganchos fixos) organizados em coordenadas X,Y, onde cada slot corresponde a uma sala. | Alta |
| RF-05 | Um braço móvel (ganchinho) deve ser capaz de se mover para qualquer coordenada X,Y da matriz. | Alta |
| RF-06 | O braço deve pegar uma chave/item de um slot e transportar até a área de retirada. | Alta |
| RF-07 | O braço deve pegar uma chave/item da área de devolução e transportar até o slot correto (após leitura RFID). | Alta |
| RF-08 | O sistema deve identificar a chave/item via RFID quando ele for inserido na área de devolução. | Alta |
| RF-09 | O sistema deve registrar o estado de cada slot (ocupado/vazio) usando sensores (ópticos, peso ou microswitch). | Média |

### Módulo 3: Retirada e Devolução

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-10 | O professor deve solicitar uma chave informando o código da sala (via teclado numérico ou touchscreen no claviculário). | Alta |
| RF-11 | Alternativamente, o professor pode solicitar a chave via app mobile (desejável). | Baixa |
| RF-12 | O sistema só libera a chave se o professor estiver autorizado (horário do timetable OU autorização manual da coordenação). | Alta |
| RF-13 | Ao retirar a chave, o sistema registra: quem, qual sala, data, hora. | Alta |
| RF-14 | Ao devolver a chave na área de devolução, o sistema lê o RFID, identifica o slot correto, aciona o braço para guardá-la e registra a devolução. | Alta |
| RF-15 | O sistema deve impedir que uma chave seja retirada se ela já estiver emprestada (status "indisponível"). | Alta |

### Módulo 4: Hierarquia e Autorização (CORRIGIDO)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-16 | **Professores** podem retirar chaves apenas dentro do horário previsto no timetable (ou com autorização especial da coordenação). | Alta |
| RF-17 | **Alunos** não podem retirar chaves do claviculário, **a menos que** a coordenação tenha concedido autorização temporária ou permanente (ex.: monitor, líder de turma). | Alta |
| RF-18 | O sistema deve permitir que a coordenação **autorize alunos específicos** a retirar chaves, com validade (data/hora ou sem expiração). | Alta |
| RF-19 | O sistema deve permitir que a coordenação **autorize professores** a retirar chaves fora do horário, com validade. | Alta |
| RF-20 | A coordenação pode visualizar logs de todas as retiradas e devoluções. | Alta |
| RF-21 | O porteiro visualiza apenas o status atual das chaves (disponível/emprestada) e alertas de pânico. | Alta |

### Módulo 5: Botão de Pânico

| ID    | Requisito                                                                                                                                | Prioridade |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| RF-22 | Cada sala piloto deve ter um botão de pânico físico na mesa do professor.                                                                | Alta       |
| RF-23 | Ao acionar o botão, o sistema deve enviar um alerta para o dashboard do porteiro contendo: andar, número da sala, data, hora.            | Alta       |
| RF-24 | O claviculário (na portaria) deve acionar um sinal luminoso (LED piscante) e um sinal sonoro leve (buzzer) quando o pânico for acionado. | Alta       |

### Módulo 6: Timetable (Integração)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-25 | O sistema deve obter os horários de aula a partir de um arquivo mock (JSON) inicialmente, simulando o timetable. | Alta |
| RF-26 | Desejável: O sistema deve fazer web scraping do sistema de timetable existente para obter dados reais. | Baixa |
| RF-27 | O sistema deve permitir que a coordenação edite/adicione autorizações temporárias (ex.: professor usa sala fora do horário). | Alta |

### Módulo 7: Interface Web (Dashboard)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-28 | O dashboard deve exibir o status de todas as chaves (disponível/emprestada, quem pegou, desde quando). | Alta |
| RF-29 | O dashboard deve exibir alertas de pânico em tempo real (com destaque visual e sonoro). | Alta |
| RF-30 | O dashboard deve permitir que a coordenação autorize professores/alunos (selecionando usuário, sala, horário de validade). | Alta |
| RF-31 | O dashboard deve permitir gerar relatórios (ex.: retiradas por período, uso de salas). | Média |
| RF-32 | O dashboard deve ter diferentes níveis de acesso: porteiro (somente leitura de status e alertas), coordenação (leitura + autorizações + relatórios). | Alta |

### Módulo 8: Interface Mobile (Desejável)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-33 | O app mobile deve permitir que o professor solicite uma chave (selecionando a sala). | Baixa |
| RF-34 | O app deve permitir que o professor acione o botão de pânico remotamente (alternativa ao botão físico). | Baixa |

### Módulo 9: Registro em Nuvem

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-35 | Todos os eventos (retirada, devolução, autorização, pânico) devem ser registrados em um banco de dados na nuvem com timestamp. | Alta |
| RF-36 | O sistema deve permitir consultar o histórico de qualquer chave ou usuário. | Alta |
| RF-37 | O sistema deve sincronizar o estado do claviculário (slots ocupados/vazios) com a nuvem em tempo real (ou near real-time). | Alta |

---

## 3.2. Requisitos Não Funcionais (RNF)

| ID | Requisito | Métrica | Prioridade |
|----|-----------|---------|------------|
| RNF-01 | Tempo de resposta – O braço deve entregar a chave em até 15 segundos após a solicitação. | ≤ 15s | Alta |
| RNF-02 | Disponibilidade – O sistema deve estar disponível durante o horário de funcionamento da faculdade (7h–22h). | 99% | Alta |
| RNF-03 | Segurança – Os dados devem ser transmitidos via HTTPS e armazenados com criptografia básica. | - | Alta |
| RNF-04 | LGPD – O sistema não pode armazenar imagens, biometria ou dados sensíveis. Apenas matrícula, nome, papel e eventos. | - | Alta |
| RNF-05 | Baixo custo – Custo total dos componentes (incluindo sucata) deve ser inferior a R$ 500,00. | ≤ R$ 500 | Alta |
| RNF-06 | Sem fechaduras elétricas – O sistema não deve incluir qualquer dispositivo que controle fisicamente a abertura de portas. | - | Alta |
| RNF-07 | Manutenibilidade – Código deve ser versionado (Git) e comentado. | - | Média |
| RNF-08 | Resistência – O braço deve suportar pelo menos 500 ciclos de movimento sem falha mecânica. | ≥ 500 ciclos | Média |

---

## 3.3. Regras de Negócio (RN)

| ID | Regra | Descrição |
|----|-------|-----------|
| RN-01 | **Professor dentro do horário** – O sistema só libera a chave se a solicitação ocorrer dentro do intervalo da aula do professor (conforme timetable ou autorização). | Alta |
| RN-02 | **Professor fora do horário** – O sistema bloqueia a retirada a menos que a coordenação tenha dado autorização explícita (válida por X horas). | Alta |
| RN-03 | **Aluno sem autorização** – Por padrão, alunos não podem retirar chaves. Apenas se a coordenação conceder autorização temporária ou permanente. | Alta |
| RN-04 | **Chave única por sala** – Uma mesma chave não pode ser retirada por dois usuários simultaneamente. O sistema marca como "emprestada" até a devolução. | Alta |
| RN-05 | **Devolução obrigatória** – Se uma chave não for devolvida até 30 minutos após o final do horário da aula (ou autorização expirada), o sistema gera notificação no dashboard. | Média |

---

# 4. Fora de Escopo (Explícito)

Os seguintes itens **não fazem parte** desta prova de conceito:

1. **Fechaduras elétricas** ou qualquer dispositivo que controle fisicamente a abertura de portas.
2. **Registro de presença de alunos** em sala (entrada/saída) – isso exigiria leitores nas portas e controle de acesso físico.
3. **Câmeras de vigilância** (LGPD).
4. **Biometria** (impressão digital, reconhecimento facial).
5. **Controle de acesso em tempo real** (ex.: impedir que alguém entre sem autorização).
6. **Cobertura para todos os 20 andares** – apenas um andar piloto (máx. 6 salas).
7. **Notificações SMS/WhatsApp** – pode ser simulado, mas não implementado.

---

# 5. Matriz de Rastreabilidade (RF x Subgrupo)

| Subgrupo | RFs relacionados |
|----------|------------------|
| Estrutura física | RF-04 |
| Mecânica e motores | RF-05, RF-06, RF-07 |
| Eletrônica e sensores | RF-01, RF-08, RF-09, RF-22, RF-23, RF-24 |
| Firmware (Arduino) | RF-05, RF-06, RF-07, RF-10, RF-13, RF-14, RF-23, RF-24, RF-37 |
| Back-end e nuvem | RF-02, RF-03, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-25, RF-26, RF-27, RF-30, RF-31, RF-35, RF-36, RF-37 |
| Front-end (dashboard) | RF-28, RF-29, RF-30, RF-31, RF-32 |
| Mobile (desejável) | RF-11, RF-33, RF-34 |
| Integração e testes | Todos |

---

# 6. Critérios de Aceite da PoC (Mínimos)

1. Braço móvel consegue se mover até coordenada X,Y, pegar uma chave e depositar na área de retirada.
2. Leitor RFID identifica crachá do professor e chave devolvida.
3. Registro em nuvem armazena e exibe no dashboard o evento de retirada.
4. Botão de pânico aciona alerta visível/sonoro no dashboard e no claviculário.
5. Dashboard mostra status das chaves (disponível/emprestada).
6. Hierarquia funciona: professor autorizado (timetable) pega chave; aluno sem autorização NÃO pega.
7. Coordenação consegue autorizar um professor fora do horário via dashboard.
8. Custo total documentado ≤ R$ 500.

---

**Fim do Documento de Requisitos (Padrão IEEE 830 – Versão Corrigida).**

---

Agora o documento está:
- **Consistente** (sem RF20, sem fechaduras elétricas).
- **Hierárquico** (alunos só pegam chave se autorizados pela coordenação).
- **Respeitoso ao padrão IEEE 830** (separa RF, RNF, RN, fora de escopo).
- **Rastreável** (matriz de rastreabilidade).

Posso, se quiser:
- Gerar uma **versão resumida para apresentação à coordenação**.
- Criar **casos de teste** para cada RF.
- Transformar em **cards para Trello/Notion** com tarefas por subgrupo.