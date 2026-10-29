# Orbe
# 🌐 Orbe

**Seu espaço digital. Do seu jeito.**

Orbe é um Progressive Web App (PWA) que transforma uma página web em um ambiente digital pessoal, reunindo aplicativos, sites, atalhos, widgets e ferramentas de produtividade em uma interface moderna e personalizável.

O projeto é inspirado na experiência de widgets do Android e da Motorola, combinada com elementos de interfaces desktop modernas, como transparências, painéis modulares e navegação simplificada.

O Orbe será multiplataforma, com suporte a Linux, Windows, Android e navegadores modernos.

> **Status:** Em desenvolvimento  
> **Versão planejada:** 0.1.0  
> **Projeto anterior:** Metro Start  
> **Hospedagem planejada:** Vercel

---

## 1. Objetivo do projeto

Criar um dashboard pessoal que permita ao usuário organizar e acessar seus recursos digitais em um único ambiente.

### Objetivos principais

- Centralizar aplicativos, sites e ferramentas.
- Oferecer uma interface moderna e personalizável.
- Disponibilizar widgets independentes e configuráveis.
- Permitir instalação como aplicativo PWA.
- Funcionar parcialmente sem conexão com a internet.
- Integrar aplicativos instalados no Linux por meio de um agente local.
- Manter uma arquitetura leve e modular.
- Evitar dependência de frameworks complexos.

## 2. Tecnologias

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura da interface |
| CSS3 | Estilização e animações |
| Tailwind CSS | Classes utilitárias via CDN durante o desenvolvimento |
| JavaScript | Funcionalidades e componentes |
| Node.js | Agente local opcional |
| IndexedDB | Armazenamento estruturado |
| localStorage | Preferências simples |
| Service Worker | Cache e funcionamento offline |
| Web App Manifest | Instalação PWA |
| Lucide Icons | Ícones da interface |
| Vercel | Hospedagem da aplicação web |

**Observação:** para a versão offline de produção, os recursos essenciais deverão ser disponibilizados localmente, sem depender exclusivamente de CDNs.

## 3. Identidade visual

O Orbe utilizará uma identidade própria, abandonando o estilo Windows Phone do antigo Metro Start.

### Diretrizes

- Interface desktop moderna.
- Tema escuro como padrão.
- Glassmorphism e transparências.
- Bordas arredondadas.
- Relógio circular inspirado nos widgets Motorola.
- Cartões e widgets modulares.
- Dock inferior com aplicativos favoritos.
- Menu lateral de navegação.
- Layout responsivo.
- Animações discretas.
- Personalização de cores e papéis de parede.

### Paleta inicial

| Elemento | Cor |
|---|---|
| Azul principal | `#168BFF` |
| Ciano | `#00C8FF` |
| Fundo escuro | `#071B2A` |
| Verde | `#22C55E` |
| Roxo | `#8B5CF6` |
| Texto secundário | `#A8B5C4` |

As cores poderão ser modificadas pelo usuário futuramente.

---

# 4. Funcionalidades planejadas

## 4.1. Interface principal

- [ ] Implementar identidade visual Orbe.
- [ ] Criar cabeçalho com pesquisa global.
- [ ] Criar menu lateral.
- [ ] Implementar dock inferior.
- [ ] Criar painel de aplicativos.
- [ ] Criar painel de acesso rápido.
- [ ] Implementar área de widgets.
- [ ] Adicionar modo tela cheia.
- [ ] Criar interface responsiva.
- [ ] Adicionar animações e transições.

## 4.2. Gerenciamento de aplicativos

- [ ] Adicionar atalhos para sites.
- [ ] Editar nome, URL e ícone.
- [ ] Buscar favicon automaticamente.
- [ ] Organizar aplicativos por categorias.
- [ ] Implementar pesquisa de aplicativos.
- [ ] Fixar aplicativos no dock.
- [ ] Remover aplicativos do dock.
- [ ] Reorganizar atalhos por arrastar e soltar.
- [ ] Importar e exportar aplicativos em JSON.
- [ ] Configurar abertura em nova aba ou janela.

## 4.3. Widgets

### Relógio

- [ ] Relógio circular inspirado na Motorola.
- [ ] Exibir data e horário.
- [ ] Suporte a formatos de 12 e 24 horas.
- [ ] Personalização de cores.
- [ ] Relógio digital alternativo.

### Clima

- [ ] Consultar informações meteorológicas reais.
- [ ] Exibir temperatura atual.
- [ ] Mostrar condições climáticas.
- [ ] Exibir temperatura máxima e mínima.
- [ ] Permitir selecionar cidade.
- [ ] Adicionar previsão resumida.

### Calendário e agenda

- [ ] Exibir calendário mensal.
- [ ] Criar eventos.
- [ ] Editar eventos.
- [ ] Excluir eventos.
- [ ] Exibir compromissos do dia.
- [ ] Salvar agenda localmente.

### Notas rápidas

- [ ] Criar notas.
- [ ] Editar notas.
- [ ] Excluir notas.
- [ ] Marcar tarefas como concluídas.
- [ ] Salvar automaticamente.
- [ ] Restaurar notas ao abrir o aplicativo.

### Sistema

- [ ] Exibir informações básicas do ambiente.
- [ ] Monitorar CPU pelo agente Linux.
- [ ] Monitorar memória RAM.
- [ ] Exibir armazenamento disponível.
- [ ] Mostrar informações do sistema operacional.
- [ ] Detectar conexão com o agente local.

### Outros widgets

- [ ] Pesquisa web.
- [ ] Calculadora.
- [ ] Cronômetro.
- [ ] Temporizador.
- [ ] Favoritos.
- [ ] Player de mídia.
- [ ] Notificações internas.

## 4.4. Gerenciamento dos widgets

- [ ] Criar arquitetura modular.
- [ ] Adicionar widgets ao dashboard.
- [ ] Remover widgets.
- [ ] Ocultar e exibir widgets.
- [ ] Arrastar widgets para reorganizar.
- [ ] Redimensionar widgets.
- [ ] Salvar posições.
- [ ] Restaurar layout.
- [ ] Criar modelos de layout.

---

# 5. Progressive Web App (PWA)

O Orbe será desenvolvido como um PWA instalável.

## Funcionalidades

- [ ] Criar `manifest.json`.
- [ ] Criar ícones de 192×192 e 512×512.
- [ ] Implementar Service Worker.
- [ ] Configurar cache dos recursos essenciais.
- [ ] Permitir instalação pelo navegador.
- [ ] Executar em janela independente.
- [ ] Implementar funcionamento offline básico.
- [ ] Detectar disponibilidade de conexão.
- [ ] Criar estratégia de atualização.
- [ ] Testar instalação no Linux.
- [ ] Testar instalação no Windows.
- [ ] Testar instalação no Android.

## Comportamento esperado

**Modo online:** todos os recursos web disponíveis, conforme as APIs utilizadas.

**Modo offline:** interface, atalhos cadastrados, notas, configurações e widgets que não dependem de serviços externos.

**Modo Linux:** funcionalidades adicionais disponíveis quando o agente local estiver instalado e autorizado.

---

# 6. Integração com Linux

O Orbe terá um agente local opcional desenvolvido em Node.js.

O agente será responsável pelas funcionalidades que não podem ser executadas diretamente pelo navegador.

## Recursos planejados

- [ ] Criar servidor local Node.js.
- [ ] Detectar aplicativos instalados.
- [ ] Ler arquivos `.desktop`.
- [ ] Obter nomes dos aplicativos.
- [ ] Obter ícones.
- [ ] Identificar categorias.
- [ ] Listar aplicativos no Orbe.
- [ ] Abrir aplicativos com `gtk-launch`.
- [ ] Consultar informações do sistema.
- [ ] Detectar disponibilidade do agente.
- [ ] Proteger endpoints locais.
- [ ] Restringir comandos executáveis.
- [ ] Implementar autorização entre PWA e agente.

### Exemplo de funcionamento

```text
Orbe PWA
    |
    | Solicitação autorizada
    v
Agente local Node.js
    |
    | Identificador do aplicativo
    v
gtk-launch
    |
    v
Aplicativo Linux
```

A comunicação deverá utilizar autenticação, validação de origem e uma lista de operações permitidas.

**Importante:** o agente não será executado na Vercel. Ele funcionará exclusivamente no computador do usuário.

---

# 7. Armazenamento

O Orbe utilizará armazenamento local para preservar informações e preferências.

## Dados armazenados

- Aplicativos cadastrados.
- Atalhos favoritos.
- Organização do dock.
- Configurações de widgets.
- Posições e tamanhos dos widgets.
- Notas e tarefas.
- Eventos do calendário.
- Tema selecionado.
- Papel de parede.
- Preferências gerais.

### Tecnologias

**localStorage:** preferências simples e dados de configuração pequenos.

**IndexedDB:** armazenamento estruturado, com maior capacidade para dados e configurações do dashboard.

### Recursos planejados

- [ ] Criar camada de armazenamento.
- [ ] Implementar salvamento automático.
- [ ] Restaurar dados ao iniciar.
- [ ] Migrar dados antigos quando necessário.
- [ ] Exportar backup JSON.
- [ ] Importar backup JSON.
- [ ] Validar arquivos de backup.
- [ ] Restaurar configurações padrão.
- [ ] Tratar falhas de armazenamento.

Inicialmente, os dados serão locais ao navegador e ao dispositivo. A sincronização entre dispositivos poderá ser estudada futuramente.

---

# 8. Estrutura planejada

```text
orbe/
│
├── index.html
├── manifest.json
├── sw.js
├── vercel.json
├── README.md
│
├── css/
│   ├── style.css
│   ├── widgets.css
│   └── themes.css
│
├── js/
│   ├── script.js
│   ├── apps.js
│   ├── widgets.js
│   ├── storage.js
│   ├── settings.js
│   ├── pwa.js
│   └── linux.js
│
├── widgets/
│   ├── clock.js
│   ├── weather.js
│   ├── calendar.js
│   ├── notes.js
│   └── system.js
│
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
│
├── assets/
│   ├── wallpapers/
│   └── images/
│
└── agent/
    ├── server.js
    └── package.json
```

Essa estrutura representa a arquitetura planejada. Os arquivos serão criados conforme as funcionalidades forem implementadas.

---

# 9. Roadmap

## Orbe 0.1 — Fundação

**Objetivo:** disponibilizar uma primeira versão PWA funcional.

- [ ] Renomear o projeto para Orbe.
- [ ] Organizar a estrutura.
- [ ] Implementar identidade visual.
- [ ] Criar relógio circular.
- [ ] Implementar aplicativos web.
- [ ] Criar dock com favoritos.
- [ ] Adicionar notas rápidas.
- [ ] Implementar armazenamento local.
- [ ] Criar manifesto PWA.
- [ ] Implementar Service Worker.
- [ ] Publicar na Vercel.

**Resultado esperado:** dashboard web instalável, com atalhos, widgets básicos e persistência de dados.

## Orbe 0.2 — Widgets

**Objetivo:** permitir personalização completa do dashboard.

- [ ] Criar gerenciador de widgets.
- [ ] Adicionar e remover widgets.
- [ ] Reorganizar widgets.
- [ ] Redimensionar componentes.
- [ ] Implementar clima real.
- [ ] Melhorar calendário.
- [ ] Criar editor de layout.
- [ ] Salvar disposição dos widgets.
- [ ] Criar temas e personalização.

**Resultado esperado:** dashboard modular e configurável.

## Orbe 0.3 — Integração Linux

**Objetivo:** permitir acesso a aplicativos instalados no computador.

- [ ] Desenvolver agente local.
- [ ] Descobrir arquivos `.desktop`.
- [ ] Listar aplicativos instalados.
- [ ] Exibir ícones e categorias.
- [ ] Abrir aplicativos locais.
- [ ] Implementar comunicação segura.
- [ ] Adicionar widget de CPU.
- [ ] Adicionar widget de RAM.
- [ ] Adicionar widget de armazenamento.

**Resultado esperado:** Orbe integrado ao ambiente Linux, mantendo a versão web independente.

## Orbe 0.4 — Produtividade

**Objetivo:** adicionar ferramentas úteis para o cotidiano.

- [ ] Calculadora.
- [ ] Temporizador.
- [ ] Cronômetro.
- [ ] Pesquisa global.
- [ ] Gerenciamento de favoritos.
- [ ] Atalhos de teclado.
- [ ] Notificações internas.
- [ ] Melhorias no calendário e nas notas.

## Orbe 0.5 — Personalização avançada

**Objetivo:** ampliar as possibilidades de customização.

- [ ] Editor visual de layouts.
- [ ] Modelos de dashboard.
- [ ] Temas personalizados.
- [ ] Papéis de parede.
- [ ] Configuração avançada do dock.
- [ ] Ajustes de espaçamento e dimensões.
- [ ] Importação e exportação de configurações.

## Orbe 1.0 — Versão estável

**Objetivo:** disponibilizar uma versão consolidada para utilização diária.

- [ ] Revisar arquitetura.
- [ ] Corrigir problemas conhecidos.
- [ ] Otimizar desempenho.
- [ ] Testar recursos offline.
- [ ] Validar segurança do agente local.
- [ ] Testar compatibilidade multiplataforma.
- [ ] Revisar acessibilidade.
- [ ] Finalizar documentação.
- [ ] Publicar versão estável.

---

# 10. Segurança

A segurança será considerada desde as primeiras etapas.

### Diretrizes

- Não permitir execução arbitrária de comandos pelo navegador.
- Validar URLs e entradas fornecidas pelo usuário.
- Restringir o agente local a operações autorizadas.
- Implementar autenticação para recursos locais.
- Proteger a comunicação entre PWA e agente.
- Evitar exposição desnecessária de informações do computador.
- Não armazenar credenciais sensíveis em código público.
- Validar arquivos importados.
- Evitar dependências externas desnecessárias.

---

# 11. Publicação

A interface web será hospedada na Vercel.

### Etapas

1. Preparar a estrutura estática.
2. Configurar os arquivos PWA.
3. Publicar o repositório.
4. Conectar o projeto à Vercel.
5. Configurar domínio, se necessário.
6. Testar instalação e funcionamento offline.
7. Validar atualizações do Service Worker.

O agente Linux será distribuído separadamente.

---

# 12. Diretrizes de desenvolvimento

O projeto seguirá os seguintes princípios:

- Utilizar HTML, CSS e JavaScript puro.
- Evitar React e outros frameworks pesados.
- Priorizar desempenho e simplicidade.
- Separar funcionalidades em módulos.
- Documentar o código com comentários.
- Manter compatibilidade com navegadores modernos.
- Preservar dados do usuário durante atualizações.
- Desenvolver funcionalidades de forma incremental.
- Evitar dependências de serviços pagos quando possível.
- Manter a interface web funcional sem o agente Linux.

---

# 13. Ideias para versões futuras

As seguintes funcionalidades poderão ser avaliadas após a versão 1.0:

- Biblioteca de widgets adicionais.
- Sistema de extensões.
- Sincronização entre dispositivos.
- Perfis de usuário.
- Integração com serviços externos.
- Widgets criados pela comunidade.
- Importação de layouts.
- Compartilhamento de temas.
- Novos agentes para outros sistemas operacionais.

Essas funcionalidades não fazem parte do escopo inicial.

---

# 14. Histórico do projeto

### Metro Start

O projeto começou como uma página de atalhos inspirada no estilo visual do Windows Phone, utilizando cartões e organização em blocos.

Posteriormente, a interface foi redesenhada para um dashboard desktop moderno, com widgets inspirados no Android e na Motorola.

### Orbe

O projeto passou a se chamar **Orbe**, adotando uma identidade visual própria e uma arquitetura baseada em PWA.

A proposta atual é criar um ambiente digital pessoal, personalizável e multiplataforma, com integração opcional aos aplicativos do Linux.

---

# 15. Situação atual

**Fase:** Planejamento e preparação da versão 0.1.

### Base existente

- Protótipo de interface desktop.
- Relógio digital.
- Menu lateral.
- Dock.
- Cartões de aplicativos.
- Notas rápidas.
- Agenda básica.
- Armazenamento local inicial.
- Conceito de agente Linux com Node.js.

Esses componentes foram desenvolvidos ou propostos durante a fase Metro Start e deverão ser revisados antes de integrar a primeira versão do Orbe.

### Próxima tarefa

**Iniciar o Orbe 0.1**, reorganizando o código existente, aplicando a nova identidade visual e preparando a estrutura PWA.

---

## Licença

A licença do projeto ainda será definida.

## Autoria

**Desenvolvimento:** Daniel Charao Machado

---

**Orbe — Seu espaço digital. Do seu jeito.**