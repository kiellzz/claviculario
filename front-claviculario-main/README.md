# 📚 Documentação Técnica: Claviculário Inteligente

## 1. Visão Geral do Projeto
Este repositório contém o módulo Front-end (Interface de Usuário) do sistema de gerenciamento de chaves (Claviculário Inteligente). O objetivo principal desta camada é fornecer uma experiência fluida, responsiva e em tempo real para o controle de acesso, integrando-se via API REST ao Back-end (Django).

## 2. Tecnologias Utilizadas
A stack escolhida visa performance, componentização e facilidade de manutenção:
* **Core:** React.js construído sob o ecossistema Vite (para *Hot Module Replacement* ultrarrápido).
* **Roteamento:** React Router Dom (para navegação SPA - *Single Page Application* sem recarregamento).
* **Estilização:** Tailwind CSS v4 (Design System em classes utilitárias, garantindo consistência no uso das cores da marca).
* **Ícones:** Lucide React (biblioteca leve e em formato SVG).

## 3. Arquitetura de Pastas e Padrões
O projeto segue a arquitetura de separação de responsabilidades (SoC - *Separation of Concerns*):

```text
src/
├── assets/         # Imagens estáticas e SVGs (ex: escudo.svg)
├── components/     # Elementos visuais reutilizáveis (Layout.jsx, Sidebar.jsx)
├── pages/          # Componentes de página (rotas inteiras da aplicação)
├── services/       # Camada de comunicação com o Back-end (API e Mocks)
├── App.jsx         # Definição e proteção do mapeamento de rotas
└── index.css       # Diretivas do Tailwind e animações globais (Keyframes)
```

## 4. Estratégia de Dados e Integração (Mock Storytelling)
Devido ao desenvolvimento paralelo das equipes de Front-end e Back-end, a arquitetura foi desenhada utilizando o padrão Adapter/Service.

Nenhuma página do React acessa dados estáticos diretamente no componente. Em vez disso, as páginas consomem funções assíncronas de ```src/services/api.js```.

- Fase Atual (PoC): Os serviços retornam dados simulados (```mockData.js```) após um ```delay``` (simulando latência de rede). Os dados mockados foram construídos com "Storytelling", garantindo que a narrativa bata entre todas as telas (ex: se uma chave é retirada no Dashboard, a sala correspondente aparece "Em aula").
- Fase de Produção: Bastará alterar o conteúdo de ```api.js``` para realizar o ```fetch()``` ou ```axios.get()``` real para os endpoints criados em Django (ex: ```/api/chaves/```), sem alterar nenhuma linha de código nas telas (```/pages```).

## 5. Módulos e Páginas Desenvolvidas
### 5.1. ```Layout.jsx``` e ```Sidebar.jsx```
- Responsáveis pela moldura estrutural ("Dashboard Container").
- Utiliza o hook ```NavLink``` do React Router para detectar dinamicamente a rota atual da barra de endereços do navegador e aplicar formatação de "estado ativo" (fundo escurecido e texto destacado) ao menu lateral.
- Implementa animações de transição de fade-in no ```<main>```.

### 5.2. ```Login.jsx```
- Interface de autenticação dividida em Grid (50/50).
- Preparada para receber a lógica de geração e persistência de token (JWT) no ```localStorage```.
- Redirecionamento simulado utilizando o hook ```useNavigate```.

### 5.3. ```Dashboard.jsx```
- Conceito: Painel centralizado de métricas e auditoria rápida.
- Componentização Interna: Renderização de métricas de topo baseada em array dinâmico (```.map()```), tabela de Histórico e listagem de Gerenciamento.
- Estado: Gerencia os dados assíncronos com exibição de Loading spinner enquanto resolve as Promises do serviço.

### 5.4. ```Salas.jsx```
- Conceito: Visão gerencial sobre o status de ocupação dos ambientes.
- Lógica: Implementa filtros locais dinâmicos em tempo real (Andar, Tipo, Status) utilizando múltiplos estados combinados com ```.filter()```.
- Renderização Condicional: Altera a UI e as tags de status ("Disponível" x "Em aula com Professor X") dinamicamente baseando-se nos atributos do objeto consumido da API.

### 5.5. ```Usuarios.jsx```
- Conceito: Controle de professores, monitores e administradores.
- Lógica: Busca reativa (Search Input) varrendo nome e matrícula.
- UX/UI: Implementa Modal (Popup) de cadastro com efeito de escurecimento de fundo (```backdrop-blur-sm```) e animações de zoom-in, controlando a exibição via booleano (```isModalOpen```).

## 6. Fluxo de Trabalho e Git (Guia para Novos Desenvolvedores)
Para garantir a integridade da branch ```main```, todos os novos desenvolvimentos devem seguir o fluxo de Feature Branching:

1. Sincronize seu repositório local: ```git pull origin main```
2. Crie sua branch de desenvolvimento: ```git checkout -b feat/nome-da-sua-tarefa```
3. Trabalhe, crie seus commits organizados em passos lógicos.
4. Envie sua branch para o repositório: ```git push -u origin feat/nome-da-sua-tarefa```
5. Realize o Merge (com Code Review, se necessário) de volta para a ```main```.

**Próximos passos previstos:**

- Criação das rotas e telas de ```/autorizacoes``` e ```/audit```.
- Substituição do ```api.js``` pela chamada HTTP (REST) oficial.
- Integração de WebSockets via Django Channels para o Botão de Pânico.
