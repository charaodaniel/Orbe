# Orbe

# 🌐 Orbe

**Seu espaço digital. Do seu jeito.**

Orbe é um Progressive Web App (PWA) que transforma uma página web em um ambiente digital pessoal, reunindo aplicativos, sites, atalhos, widgets e ferramentas de produtividade em uma interface moderna e personalizável.

O projeto é inspirado na experiência de widgets do Android e da Motorola, combinada com elementos de interfaces desktop modernas, como transparências, painéis modulares e navegação simplificada.

O Orbe será multiplataforma, com suporte a Linux, Windows, Android e navegadores modernos.

> **Status:** Fases 1 a 4 implementadas; validação em navegadores e desktop Linux pendente
> **Versão:** 0.1.0 em desenvolvimento  
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

| Tecnologia       | Utilização                                                  |
| ---------------- | ----------------------------------------------------------- |
| HTML5            | Estrutura da interface                                      |
| CSS3             | Estilização e animações                                     |
| Tailwind CSS     | Não utilizado atualmente; a interface usa CSS próprio       |
| JavaScript       | Funcionalidades e componentes                               |
| Node.js          | Agente local opcional                                       |
| IndexedDB        | Planejado; os dados atuais usam localStorage                |
| localStorage     | Persistência de notas, agenda e configuração via `js/storage.js` |
| Service Worker   | Cache local, fallback offline e atualização sob confirmação |
| Web App Manifest | Instalação PWA                                              |
| Lucide Icons     | Ícones locais em `js/vendor/lucide.min.js`                  |
| Open-Meteo       | Geocodificação e previsão meteorológica sem chave de API    |
| Vercel           | Hospedagem da aplicação web                                 |

**Observação:** os recursos funcionais essenciais não dependem de CDN. Os fundos fotográficos são decorativos e ainda usam URLs externas; os gradientes permanecem como fallback offline.

### Testes automatizados

Os testes nativos do Node cobrem persistência/migração, manifesto e recursos
offline, fallback do Service Worker, fluxo de atualização e integração do
agente Linux:

```sh
node --test test/*.test.js agent/server.test.js
```

Eles não substituem a validação de instalação, layout e interação em navegadores
reais. A lista de verificações manuais pendentes está no [roadmap](./roadmap.md).

## 3. Identidade visual

O Orbe utiliza uma identidade própria, abandonando o estilo Windows Phone do antigo Metro Start.

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

| Elemento         | Cor       |
| ---------------- | --------- |
| Azul principal   | `#168BFF` |
| Ciano            | `#00C8FF` |
| Fundo escuro     | `#071B2A` |
| Verde            | `#22C55E` |
| Roxo             | `#8B5CF6` |
| Texto secundário | `#A8B5C4` |

As cores poderão ser modificadas pelo usuário futuramente.

---

# 4. Funcionalidades planejadas

## 4.1. Interface principal

- [x] Implementar identidade visual Orbe básica.
- [x] Criar cabeçalho com pesquisa de aplicativos.
- [x] Criar menu lateral.
- [x] Implementar dock inferior.
- [x] Criar painel de aplicativos.
- [x] Criar painel de acesso rápido.
- [x] Implementar área de widgets básica.
- [ ] Adicionar modo tela cheia.
- [x] Criar interface responsiva.
- [x] Adicionar transições básicas.

## 4.2. Gerenciamento de aplicativos

- [ ] Adicionar atalhos para sites.
- [x] Editar nome e ícone dos aplicativos fixados na dock.
- [ ] Editar URL e cadastrar novos atalhos para sites.
- [ ] Buscar favicon automaticamente.
- [ ] Organizar aplicativos por categorias.
- [x] Implementar pesquisa de aplicativos.
- [x] Fixar e remover aplicativos predefinidos da dock.
- [x] Reorganizar atalhos da dock por arrastar e soltar.
- [ ] Importar e exportar aplicativos em JSON.
- [x] Abrir links configurados em nova aba.

## 4.3. Widgets

### Relógio

- [x] Relógio circular inspirado na Motorola.
- [x] Exibir data e horário.
- [x] Suporte a formatos de 12 e 24 horas.
- [ ] Personalização de cores.
- [ ] Relógio digital alternativo.

### Clima

- [x] Consultar informações meteorológicas reais.
- [x] Exibir temperatura atual.
- [x] Mostrar condições climáticas.
- [x] Exibir temperatura máxima e mínima.
- [x] Permitir selecionar cidade.
- [x] Exibir máxima, mínima, sensação térmica e umidade.
- [x] Selecionar Celsius ou Fahrenheit, incluindo conversão do último dado salvo offline.

> O clima usa geocodificação e previsão da Open-Meteo. A última previsão é mantida localmente; novas consultas e cidades exigem conexão.

### Calendário e agenda

- [x] Exibir calendário mensal.
- [x] Criar eventos.
- [x] Editar eventos.
- [x] Excluir eventos.
- [x] Exibir compromissos do dia.
- [x] Salvar agenda localmente.
- [x] Selecionar um dia no calendário e mostrar seus eventos.

### Notas rápidas

- [x] Criar notas.
- [x] Editar notas.
- [x] Excluir notas.
- [x] Marcar tarefas como concluídas.
- [x] Salvar automaticamente.
- [x] Restaurar notas ao abrir o aplicativo.

### Sistema

- [x] Exibir informações básicas do ambiente disponíveis ao navegador.
- [x] Exibir carga média da CPU e memória livre via agente Linux autorizado.
- [ ] Exibir armazenamento livre do dispositivo.
- [x] Identificar a plataforma reportada pelo navegador.
- [x] Detectar conexão com o agente local.

> Sem o agente, o navegador informa apenas núcleos lógicos e a quota deste site. Com autorização explícita no agente Linux, o Orbe exibe carga média e memória livre agregadas; não coleta processos nem armazenamento livre do dispositivo.

### Outros widgets

- [ ] Pesquisa web.
- [ ] Calculadora.
- [ ] Cronômetro.
- [ ] Temporizador.
- [ ] Favoritos.
- [ ] Player de mídia.
- [ ] Notificações internas.

## 4.4. Gerenciamento dos widgets

- [x] Criar ciclo de vida modular com montagem e descarte dos widgets essenciais.
- [x] Persistir preferências de formato de relógio e unidade de temperatura.
- [x] Adicionar, remover, ocultar e exibir widgets existentes.
- [x] Reordenar widgets por controles acessíveis.
- [x] Redimensionar widgets em três tamanhos responsivos.
- [x] Salvar e restaurar layout, tema, papel de parede e preferências.
- [x] Personalizar o dashboard com temas e papéis de parede predefinidos.
- [x] Exportar e importar configurações JSON com validação.

---

# 5. Progressive Web App (PWA)

O Orbe é desenvolvido como um PWA instalável; a validação de instalação por plataforma ainda está pendente.

## Funcionalidades

- [x] Criar `manifest.json`.
- [x] Criar ícones de 192×192 e 512×512.
- [x] Implementar Service Worker.
- [x] Configurar cache dos recursos essenciais locais.
- [x] Configurar instalação pelo navegador no manifesto.
- [x] Configurar execução em janela independente.
- [x] Implementar funcionamento offline básico.
- [x] Detectar disponibilidade de conexão.
- [x] Criar atualização com confirmação do usuário.
- [x] Automatizar a validação do manifesto, ícones e recursos essenciais no cache.
- [ ] Testar instalação no Linux.
- [ ] Testar instalação no Windows.
- [ ] Testar instalação no Android.

## Comportamento esperado

**Modo online:** todos os recursos web disponíveis, conforme as APIs utilizadas.

**Modo offline:** interface, atalhos cadastrados, notas, configurações e widgets que não dependem de serviços externos.

**Modo Linux:** funcionalidades adicionais disponíveis quando o agente local estiver instalado e autorizado.

---

# 6. Integração com Linux

O Orbe possui um agente local opcional desenvolvido em Node.js. A lista de
aplicativos e as métricas ficam indisponíveis até o usuário informar o token de
pareamento mostrado no terminal do agente.

O agente é limitado ao loopback, valida a origem da PWA, autentica cada
operação, lê entradas `.desktop` instaladas e inicia aplicativos somente por
IDs conhecidos com `gtk-launch`. O token permanece em memória na sessão atual
do navegador e pode ser revogado pela interface.

## Recursos implementados

- [x] Criar servidor local Node.js com endpoint de diagnóstico.
- [x] Detectar aplicativos instalados a partir de arquivos `.desktop`.
- [x] Validar entradas `.desktop` e não expor caminhos nem comandos à PWA.
- [x] Listar nomes, ícones e categorias disponíveis no Orbe.
- [x] Abrir aplicativos instalados por identificadores permitidos com `gtk-launch`.
- [x] Consultar carga média da CPU e memória livre após autorização.
- [x] Detectar disponibilidade do agente.
- [x] Proteger endpoints locais com loopback, CORS explícito e token aleatório.
- [x] Restringir operações a rotas e IDs de aplicativos permitidos.
- [x] Implementar autorização e revogação por sessão na PWA.
- [x] Documentar instalação, atualização, remoção, modelo de ameaça e contrato da API em [`agent/README.md`](./agent/README.md).

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

O agente escuta somente em `127.0.0.1:4317`. Para uma origem HTTPS hospedada,
é necessário autorizá-la explicitamente por `ORBE_ALLOWED_ORIGINS` ao iniciar o
agente. A validação da interface em um desktop Linux real continua pendente.

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

**localStorage:** persistência de notas, agenda e configuração do dashboard por meio da camada `js/storage.js`.

**IndexedDB:** armazenamento estruturado, com maior capacidade para dados e configurações do dashboard.

### Recursos planejados

- [x] Criar camada de armazenamento para notas e agenda.
- [x] Implementar salvamento automático.
- [x] Restaurar dados ao iniciar.
- [x] Migrar dados legados de notas e agenda sem apagar as chaves antigas.
- [x] Exportar e importar configurações do dashboard em JSON.
- [x] Validar esquema e tamanho de arquivos importados antes de aplicar.
- [ ] Restaurar configurações padrão.
- [x] Tratar falhas de leitura e gravação do armazenamento.
- [x] Salvar cidade, última previsão e preferências de relógio/unidades localmente.

Inicialmente, os dados serão locais ao navegador e ao dispositivo. A sincronização entre dispositivos poderá ser estudada futuramente.

---

# 8. Estrutura atual e planejada

```text
orbe/
│
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── relatorio.md
├── roadmap.md
│
├── css/
│   └── style.css
│
├── js/
│   ├── script.js
│   ├── storage.js
│   ├── pwa.js
│   ├── widgets.js
│   ├── calendar.js
│   ├── weather.js
│   ├── linux.js
│   └── vendor/
│       └── lucide.min.js
│
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
│
└── agent/
    └── server.js
```

Ainda planejados: configuração explícita da Vercel, módulos de aplicativos e configurações, estilos separados por widget/tema, widgets independentes, assets locais e empacotamento próprio do agente. A estrutura será expandida quando essas funcionalidades forem implementadas.

---

# 9. Roadmap

## Orbe 0.1 — Fundação

**Objetivo:** disponibilizar uma primeira versão PWA funcional.

- [x] Renomear o projeto para Orbe.
- [x] Organizar a estrutura inicial.
- [x] Implementar identidade visual básica.
- [x] Criar relógio circular.
- [x] Implementar atalhos para aplicativos e sites.
- [x] Criar dock com atalhos.
- [x] Adicionar notas rápidas.
- [x] Implementar armazenamento local com migração.
- [x] Criar manifesto PWA.
- [x] Implementar Service Worker.
- [ ] Publicar na Vercel.

**Resultado esperado:** dashboard web instalável, com atalhos, widgets básicos e persistência de dados.

### Critérios de conclusão da versão 0.1

- [x] Recursos essenciais locais e ícones disponíveis sem dependência de CDN.
- [x] Notas e eventos podem ser criados, editados, removidos e persistidos.
- [x] Dados antigos são migrados sem apagar as chaves de origem.
- [x] Clima consulta dados reais e métricas não disponíveis ao navegador não são simuladas.
- [ ] Instalação, abertura independente, uso offline e atualização validados nos navegadores e dispositivos suportados.
- [ ] Fluxos principais validados em desktop e celular, incluindo teclado, estados vazios e erros de armazenamento.

## Orbe 0.2 — Widgets

**Objetivo:** permitir personalização completa do dashboard.

- [x] Criar gerenciador técnico do ciclo de vida dos widgets.
- [x] Adicionar e remover widgets.
- [x] Reorganizar widgets.
- [x] Redimensionar componentes.
- [x] Implementar clima real com seleção de cidade.
- [x] Implementar calendário mensal integrado aos eventos.
- [x] Criar editor de layout.
- [x] Salvar disposição dos widgets.
- [x] Criar temas e personalização.

**Resultado esperado:** dashboard modular e configurável.

## Orbe 0.3 — Integração Linux

**Objetivo:** permitir acesso a aplicativos instalados no computador.

- [x] Desenvolver agente local.
- [x] Descobrir arquivos `.desktop`.
- [x] Listar aplicativos instalados.
- [x] Exibir ícones e categorias.
- [x] Abrir aplicativos locais por ID autorizado.
- [x] Implementar comunicação segura.
- [x] Exibir carga média e memória agregada via agente.
- [ ] Validar a integração em um desktop Linux real.

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

**Fase:** Consolidação da versão 0.1; validação em dispositivos reais pendente.

### Base existente

- Dashboard responsivo com pesquisa, menu, dock e painéis de aplicativos.
- Perfil abre um modal com acesso ao dashboard e às opções de personalização; o painel de personalização fica oculto até ser solicitado.
- Relógio circular com data e horário.
- Agenda e notas com criação, edição, remoção e persistência local.
- Migração das chaves antigas `metro-start-*` sem apagar os dados de origem.
- Manifesto, ícones, cache offline e atualização confirmada do Service Worker.
- Gerenciamento da dock e dos widgets: organizar por arrastar ou controles acessíveis, editar nomes e ícones Lucide dos apps e nomes/tamanhos/visibilidade dos widgets; alterações são persistidas e exportadas.
- Indicador de conexão e previsão do tempo obtida via Open-Meteo.
- Informações do sistema limitadas ao navegador, ou métricas agregadas via agente Linux opcional.
- Agente Linux local autorizado por token, com descoberta e abertura de aplicativos instalados por identificador.

### Próxima tarefa

**Concluir a validação manual da Fase 1** em navegadores e dispositivos Linux,
Windows e Android, incluindo instalação, funcionamento offline, layout,
interações e atualização do Service Worker. A implementação e os testes
automatizados estão concluídos; a validação visual em navegador real continua
pendente.

---

## Licença

A licença do projeto ainda será definida.

## Autoria

**Desenvolvimento:** Daniel Charao Machado

---

**Orbe — Seu espaço digital. Do seu jeito.**
