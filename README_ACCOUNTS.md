# Contas no aplicativo CASA

Esta branch acompanha a atualização de contas do backend CASA (`feature/user-accounts`). O app continua em Expo SDK 54; não houve atualização geral de SDK.

## Funcionalidades

- Login com o mesmo e-mail e senha do site; a sessão mobile é independente da sessão do navegador.
- Administradores informam o código do autenticador ou um código de recuperação. A configuração inicial do segundo fator ocorre no site.
- Sessões ficam no `expo-secure-store`, com expiração e revogação pelo servidor.
- Usuários comuns veem a lista de estações vinculadas e abrem o site para gráficos e exportação. Abrir o navegador pode exigir novo login.
- As telas de cadastro e de configuração BLE ficam disponíveis apenas para administradores. As operações também verificam a conta na API.
- O cadastro envia a sessão ao backend e retoma provisionamentos interrompidos. Depois da confirmação do ESP32, o app confirma o provisionamento no servidor; a primeira medição também conclui essa confirmação.
- Mensagens BLE com credenciais não são mais impressas no log do app.
- Utilitários foram movidos de `app/services` e `app/config` para `src/`, deixando apenas telas no diretório de rotas.

O firmware atual continua usando `save_identity`, `configure_wifi` e os demais comandos existentes. **A autenticação do aplicativo não impede comandos enviados por outro cliente BLE.** A autorização no próprio ESP32 precisa de uma atualização separada do firmware.

## Compilação e validação

```bash
npm ci
npx tsc --noEmit
npm run lint
npx expo export --platform android
```

Os perfis `preview` e `production` usam `https://t2phealth.com.br/api`. Para homologação, altere `EXPO_PUBLIC_API_BASE_URL` para o endereço HTTPS do ambiente de teste antes de compilar. Um APK de distribuição recusa login por HTTP; HTTP só é permitido em execução de desenvolvimento (`__DEV__`).

É necessário **um novo binário**, pois foi adicionado um módulo nativo (`expo-secure-store`). Atualizar apenas o JavaScript de um APK anterior não é suficiente.

Para gerar o APK com a conta EAS já utilizada pelo projeto:

```bash
npx eas-cli build --platform android --profile preview
```

O comando solicita a autenticação EAS do projeto. Ele não foi executado como parte desta alteração, e nenhum APK foi publicado automaticamente.

## Teste integrado

1. Suba o backend e o site de homologação com contas e HTTPS.
2. Crie o administrador, configure TOTP no site e aguarde o próximo código antes de entrar no app.
3. Entre com uma conta comum: confirme que apenas suas estações aparecem e que links diretos para telas de configuração não abrem.
4. Entre com um administrador e provisione uma estação de teste. Feche o app antes de gravar a identidade, abra novamente e confirme que o cadastro pode ser retomado sem duplicar estação.
5. Confirme Wi-Fi, recebimento de dados e troca de rede usando um ESP32 real.
6. Encerre/revogue a sessão pelo servidor e confira que o app exige novo login.
7. Teste retorno do app após ficar em segundo plano e comportamento sem conexão com a API. Nesta versão, configurar uma estação pelo app oficial exige conexão com o servidor para validar a permissão.

As verificações TypeScript, lint e exportação do bundle não substituem o teste do APK instalado, do BLE e do armazenamento nativo em um telefone.
