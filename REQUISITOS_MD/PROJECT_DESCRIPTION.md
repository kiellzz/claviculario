# PROJETO INTEGRADOR – CLAVICULÁRIO AUTOMATIZADO  
**Versão descritiva – PoC (Prova de Conceito)**

---

## 1. NOME DO PROJETO (EM DEFINIÇÃO)
- *Guardião das Chaves*  
- *Chave do Sertão*  
- *Claviculário do Frevo*  
- *Mestre Sala* (referência ao frevo)  
- *Lanceiro da Portaria* (referência ao Maracatu)  
- *Caboclo de Lança*  
- *Custódio do Tempo* (timetable + chaves)

---

## 2. CONTEXTO E PROBLEMAS
A faculdade ocupa um prédio de mais de 20 andares, com dezenas de salas de aula, cada uma com sua chave física. O controle atual das chaves é manual, sem rastreabilidade real. O prédio é público e não há controle de acesso efetivo, gerando riscos de segurança. Existe uma hierarquia de uso e os itens de sala (controles de projetor, canetas, apagadores) também precisam de gestão.

---

## 3. OBJETIVO DO PROJETO
Criar uma **prova de conceito (PoC)** de um **claviculário automatizado** que:
- Automatize o registro de retirada/devolução.
- Identifique usuários via RFID.
- Registre eventos em nuvem.
- Ofereça interfaces web (porteiro/coordenação) e mobile (professores/alunos).
- Implemente hierarquia de autorização e botão de pânico.
- Integre com o timetable via scraping (desejável).

---

## 4. SOLUÇÃO PROPOSTA – CLAVICULÁRIO AUTOMATIZADO
- **Mecanismo Físico:** Matriz de slots X,Y com braço móvel automatizado.
- **Identificação:** Etiquetas RFID em crachás, chaves e kits de itens.
- **Hierarquia:** Professores retiram chaves; alunos entram se o professor estiver presente.
- **Botão de Pânico:** Alerta visual/sonoro na portaria e no dashboard.
- **Nuvem:** Backend em Firebase/AWS para logs e controle dinâmico.

---

## 5. ORGANIZAÇÃO DAS EQUIPES (40 ALUNOS)
Divididos em subgrupos:
1. Estrutura física (Maquete).
2. Mecânica e motores (Robótica/Motores de passo).
3. Eletrônica e sensores (Arduino/RFID).
4. Firmware (C++ Arduino).
5. Back-end e nuvem (Node.js/Python).
6. Front-end dashboard (React/Vue).
7. Mobile e QR Code (Flutter/PWA).
8. Integração e testes.

---

## 6. ESCOPO DA PoC
- **Obrigatório:** Estrutura física funcional para um andar, RFID, registro em nuvem, dashboard básico e botão de pânico.
- **Desejável:** Integração com timetable, interface mobile, braço 180°.
- **Fora:** Fechaduras elétricas nas portas, biometria, cobertura total do prédio.

---

## 7. RESTRIÇÕES
- **Orçamento:** Baixo custo/sucata.
- **Prazo:** Um semestre letivo.
- **Tecnologias:** Arduino, RFID RC522, ESP8266/ESP32, Firebase.

---

## 8. PRÓXIMOS PASSOS
Elaborar DRS (Documento de Requisitos) e TAP (Termo de Abertura do Projeto).
