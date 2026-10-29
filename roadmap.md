# Roadmap do Orbe

**Objetivo:** levar a base atual do dashboard até uma versão 0.1 estável e, depois, avançar para widgets configuráveis e integração Linux.

**Status:** Fases 1 e 2 implementadas; validação visual em dispositivos reais continua pendente.

## Base já existente

- [x] Identidade Orbe no título, cabeçalho e painel do sistema.
- [x] Dashboard responsivo com navegação, dock e cartões de aplicativos.
- [x] Relógio, calendário mensal, agenda e notas com persistência local.
- [x] Manifesto, ícones e registro do service worker.
- [x] Agente local opcional com endpoint de diagnóstico.
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

**Dependência:** concluir a estratégia de dados da Fase 1 antes de persistir configurações de widgets.

## Fase 3: personalização do dashboard

- [ ] Criar controles para adicionar, ocultar e remover widgets.
- [ ] Implementar reordenação e redimensionamento.
- [ ] Salvar e restaurar disposição, tema e preferências.
- [ ] Adicionar temas e configuração de papel de parede.
- [ ] Implementar importação e exportação de configuração com validação.

**Dependência:** definir o modelo de dados dos widgets na Fase 2 antes de salvar layouts configuráveis.

## Fase 4: agente Linux seguro

- [ ] Definir o modelo de ameaça e o contrato entre PWA e agente.
- [ ] Restringir CORS às origens autorizadas e definir autorização antes de expor novas operações.
- [ ] Documentar instalação, inicialização, atualização e remoção do agente.
- [ ] Ler e validar arquivos `.desktop` sem aceitar caminhos ou comandos arbitrários.
- [ ] Listar aplicativos, categorias e ícones disponíveis.
- [ ] Implementar abertura de aplicativos usando identificadores permitidos.
- [ ] Implementar consulta de métricas com dados mínimos e permissões explícitas.
- [ ] Testar agente ausente, indisponível, origem não autorizada e entradas inválidas.

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
4. Desenvolver a integração Linux somente após fechar o modelo de segurança da Fase 4.
5. Executar a revisão de publicação da Fase 5.
