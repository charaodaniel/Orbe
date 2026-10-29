# Agente Linux do Orbe

O agente é opcional e local. Ele permite listar aplicativos do menu Linux,
iniciá-los por um identificador já instalado e consultar métricas agregadas.
Sem o agente, o dashboard web continua funcionando.

## Modelo de ameaça e limites

- O servidor escuta somente em `127.0.0.1:4317`; acessos a outros endereços e
  cabeçalhos `Host` não locais são recusados.
- CORS aceita apenas as origens de desenvolvimento locais documentadas abaixo
  ou origens HTTPS explicitamente configuradas. CORS não substitui autenticação.
- Cada inicialização gera um token aleatório novo, exibido no terminal. As
  operações da API exigem esse token por `Authorization: Bearer`.
- A PWA mantém o token somente em memória durante a sessão atual. Informe-o na
  seção **Agente Linux** das configurações; não o salve em arquivos ou consultas.
- A API nunca recebe caminhos nem linhas de comando. Para abrir aplicativos,
  aceita somente um ID encontrado na lista local e chama `gtk-launch` com esse
  ID como argumento, sem shell.
- Arquivos `.desktop` são lidos apenas dos diretórios de aplicativos XDG do
  usuário e do sistema. Entradas ocultas, inválidas e executáveis de shell ou
  interpretadores são ignorados. A API não expõe o campo `Exec` nem caminhos.
- Ícones são resolvidos somente em diretórios conhecidos de temas do sistema e
  do usuário; nomes são validados, symlinks que escapem das raízes são
  recusados e cada imagem tem limite de 2 MB. O conteúdo é servido apenas com
  autorização.
- Métricas limitam-se a número de CPUs lógicas, carga média de 1 minuto e
  memória total/livre. Não há coleta de processos, arquivos pessoais ou
  telemetria.
- O token não protege contra malware já executado como o mesmo usuário, acesso
  local ao terminal que o exibiu ou uma PWA comprometida pela própria origem.
  Use apenas origens confiáveis e mantenha o navegador atualizado.

O agente não implementa execução de comandos arbitrários, terminal remoto,
abertura de caminhos fornecidos pela PWA ou operações privilegiadas.

## Requisitos

- Linux com Node.js 18 ou superior.
- `gtk-launch` disponível no ambiente de desktop.

## Instalar e iniciar

Não há instalador nem serviço em segundo plano nesta versão. Mantenha uma cópia
local do repositório, abra um terminal nessa cópia e execute:

```sh
node agent/server.js
```

O agente informa o token de pareamento no terminal. Mantenha-o privado e
informe-o nas configurações do Orbe. Para parar o agente, pressione `Ctrl+C`.
Cada reinicialização gera um token novo, que deve ser informado novamente.

Por padrão, CORS aceita `localhost` e `127.0.0.1` nas portas 3000, 4173, 5173 e
8000. Para usar uma implantação HTTPS própria, configure a origem exata antes
de iniciar:

```sh
ORBE_ALLOWED_ORIGINS="https://orbe.example" node agent/server.js
```

Múltiplas origens são separadas por vírgula. Não use `*`; origens HTTP remotas
são recusadas. O servidor continua limitado ao loopback mesmo quando a PWA é
hospedada remotamente.

## Atualizar e remover

Para atualizar, pare o processo com `Ctrl+C`, atualize os arquivos do
repositório por seu método habitual e execute novamente `node agent/server.js`.
Não há migrações nem dados locais mantidos pelo agente.

Para remover, pare o processo e apague a cópia local do repositório. O agente
não cria serviços de inicialização automática, arquivos de configuração ou
alterações nos aplicativos instalados.

## API local

| Método | Rota | Autorização | Uso |
| --- | --- | --- | --- |
| `GET` | `/health` | Não | Verifica disponibilidade; não retorna dados do dispositivo. |
| `GET` | `/api/apps` | Bearer | Lista aplicativos disponíveis, sem caminhos ou comandos. |
| `GET` | `/api/icons/{id}` | Bearer | Retorna um ícone de tema instalado pelo identificador validado. |
| `POST` | `/api/apps/launch` | Bearer | Inicia um ID listado; corpo JSON: `{"id":"identificador"}`. |
| `GET` | `/api/system` | Bearer | Retorna somente métricas agregadas documentadas acima. |

Todas as rotas são restritas ao loopback. Ações exigem uma origem permitida,
autorização, entrada validada e operação explicitamente suportada.

## Testes

Execute os testes de API e validação sem iniciar um desktop:

```sh
node --test agent/server.test.js
```
