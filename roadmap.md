# Roadmap do Orbe

**Objetivo:** levar a base atual do dashboard até uma versão 0.1 estável e, depois, avançar para widgets configuráveis e integração Linux.

**Status:** Fases 1 a 4 implementadas; validação das fases 1 a 3 em navegadores e dispositivos reais e validação da integração em desktop Linux continuam pendentes.

## Base já existente

- [x] Identidade Orbe no título, cabeçalho e painel do sistema.
- [x] Dashboard responsivo com navegação, dock e cartões de aplicativos.
- [x] Relógio, calendário mensal, agenda e notas com persistência local.
- [x] Manifesto, ícones e registro do service worker.
- [x] Agente Linux local opcional com autorização, lista de aplicativos e métricas agregadas.
- [ ] Validar os fluxos completos em navegador e dispositivos reais.

## Fase 1: consolidar a versão 0.1

### Documentação e escopo

- [x] Atualizar no README o status atual, marcando separadamente recursos completos, parciais e pendentes.
- [x] Definir os critérios de conclusão da versão 0.1.
- [x] Identificar na interface os valores demonstrativos de clima e sistema, até existirem integrações reais.

### PWA e funcionamento offline

- [x] Remover a dependência Tailwind não utilizada e disponibilizar Lucide localmente.
- [ ] Testar instalação e abertura em janela independente.
- [ ] Testar primeira carga, cache, navegação offline e retorno à conexão.
- [x] Definir como o service worker informa e aplica atualizações.
- [ ] Testar o fluxo de atualização em navegador.
- [ ] Validar manifesto e ícones em Linux, Windows, Android e navegadores suportados.

### Dados e fluxos básicos

- [x] Definir uma camada de armazenamento para notas e agenda, preparada para outros valores.
- [x] Preservar e migrar os dados das chaves `metro-start-notes` e `metro-start-agenda` sem removê-las.
- [x] Adicionar edição e remoção de notas e eventos.
- [x] Tratar erros de leitura e gravação do armazenamento.
- [ ] Testar persistência após recarga e funcionamento offline.

### Interface e validação

- [ ] Validar pesquisa, atalhos de teclado, dock e navegação em navegador.
- [ ] Verificar layout em telas pequenas, médias e desktop.
- [x] Implementar estados vazios, mensagens de erro e controles acessíveis.
- [x] Corrigir diferenças documentais entre o comportamento previsto e o comportamento implementado.

**Marco de saída:** dashboard instalável com recursos locais essenciais funcionando offline, dados preservados e comportamento documentado com precisão.

## Fase 2: completar os widgets essenciais

- [x] Definir interface comum (`mount`/descarte) e ciclo de vida dos widgets.
- [x] Implementar seleção de cidade e previsão real via Open-Meteo.
- [x] Implementar calendário mensal, seleção de dia e operações completas de eventos.
- [x] Definir informações seguras disponíveis em cada plataforma pelo navegador.
- [x] Remover indicadores simulados de CPU/RAM e exibir somente dados reais disponíveis.
- [x] Adicionar preferências persistidas para formato do relógio e unidade de temperatura.
- [x] Manter a última previsão e permitir conversão de unidade sem conexão.
- [x] Definir o modelo de dados dos widgets necessário para persistir layouts configuráveis.

**Dependência:** concluir a estratégia de dados da Fase 1 antes de persistir configurações de widgets.

## Fase 3: personalização do dashboard

- [x] Criar controles para adicionar, ocultar e remover widgets existentes.
- [x] Implementar reordenação acessível e redimensionamento responsivo.
- [x] Salvar e restaurar disposição, tema, papel de parede e preferências.
- [x] Adicionar temas e opções de papel de parede predefinidas.
- [x] Implementar exportação e importação de configuração com validação de esquema e limite de tamanho.

**Dependência:** definir o modelo de dados dos widgets na Fase 2 antes de salvar layouts configuráveis.

## Fase 4: agente Linux seguro

- [x] Definir o modelo de ameaça e o contrato entre PWA e agente.
- [x] Restringir CORS às origens autorizadas e exigir token para operações.
- [x] Documentar instalação, inicialização, atualização e remoção do agente.
- [x] Ler e validar arquivos `.desktop` sem aceitar caminhos/comandos da PWA.
- [x] Listar aplicativos, categorias e ícones disponíveis.
- [x] Implementar abertura de aplicativos usando IDs listados e `gtk-launch`.
- [x] Implementar consulta autorizada de métricas agregadas mínimas.
- [x] Automatizar testes de CORS, autorização, entradas inválidas, limite de requisição e rotas protegidas.
- [ ] Validar agente ausente/indisponível, autorização e abertura de aplicativos em um desktop Linux real.

**Regra de segurança:** não adicionar execução genérica de comandos. Cada operação local deve ser explícita, validada e autorizada.

## Fase 5: preparação para publicação

- [ ] Executar testes de regressão dos fluxos principais.
- [ ] Revisar acessibilidade, foco, contraste e navegação por teclado.
- [ ] Revisar dependências externas, privacidade e comportamento offline.
- [ ] Confirmar configuração e variáveis necessárias para hospedagem estática na Vercel.
- [ ] Publicar uma versão de teste e validar instalação, atualização e rotas.
- [ ] Atualizar README, instruções de uso e limitações conhecidas.
- [ ] Definir licença e versão antes de declarar a versão estável.

## Ordem recomendada

1. Concluir a Fase 1 e sincronizar a documentação.
2. Implementar os widgets essenciais da Fase 2.
3. Avançar para personalização na Fase 3.
4. Validar em desktop Linux a integração implementada na Fase 4.
5. Executar a revisão de publicação da Fase 5.
