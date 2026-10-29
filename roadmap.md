# Roadmap do Orbe

**Objetivo:** levar o dashboard a uma versão estável, com personalização da dock e dos ícones e validação nos ambientes suportados.

**Status:** Gerenciamento da dock e dos ícones implementado. Permanecem validações manuais em navegadores/dispositivos reais e a preparação para publicação.

## Fase 1: validação da versão 0.1

### PWA e funcionamento offline

- [ ] Validar instalação e abertura em janela independente nos navegadores suportados.
- [ ] Testar primeira carga, cache, navegação offline, reconexão e atualização em navegador.
- [ ] Validar manifesto e ícones em Linux, Windows, Android e navegadores suportados.

### Dados e interface

- [ ] Confirmar persistência após recarga e edição offline em navegador instalado.
- [ ] Validar pesquisa, atalhos de teclado, dock e navegação por teclado/mouse em navegador.
- [ ] Verificar visualmente layouts em telas pequenas, médias e desktop.

## Fase 3: personalização do dashboard

- [x] Permitir adicionar e remover atalhos da dock.
- [x] Reordenar atalhos e widgets por arrastar e soltar, mantendo controles acessíveis por teclado.
- [x] Editar nomes e ícones dos atalhos, e nomes, tamanho e visibilidade dos widgets.
- [x] Persistir preferências e incluí-las na importação/exportação, com validação e migração de configurações anteriores.

## Fase 4: validação do agente Linux

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

1. Concluir a validação manual da Fase 1.
2. Validar o gerenciamento da dock e dos ícones em navegadores reais.
3. Validar em desktop Linux a integração da Fase 4.
4. Executar a revisão de publicação da Fase 5.
