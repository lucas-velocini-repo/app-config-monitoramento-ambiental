# Aplicativo de Configuração — CASA

Aplicativo móvel do projeto **CASA — Central de Acompanhamento de Saúde e Ambiente**, desenvolvido em **React Native com Expo**.

O aplicativo é responsável pela configuração das estações ambientais baseadas em ESP32, utilizando **Bluetooth Low Energy (BLE)** para comunicação local com o dispositivo.

Seu objetivo principal é permitir que uma estação seja instalada e configurada sem necessidade de conectar o ESP32 a um computador ou modificar e recompilar seu firmware.

---

## Visão geral

O aplicativo funciona como interface de configuração entre o usuário, a estação ESP32 e o servidor CASA.

O fluxo geral é:

```text
Aplicativo
    │
    │ BLE
    ▼
ESP32
    │
    │ Wi-Fi
    ▼
Servidor CASA
```

Durante a primeira configuração, também ocorre o provisionamento da estação:

```text
Aplicativo
    │
    │ HTTP/HTTPS
    ▼
Servidor CASA
    │
    │ identificação + credencial
    ▼
Aplicativo
    │
    │ BLE
    ▼
ESP32
```

Depois desse processo, a estação pode operar autonomamente.

---

## Principais funcionalidades

Atualmente o aplicativo permite:

* solicitar as permissões Bluetooth necessárias;
* procurar estações CASA próximas através de BLE;
* conectar a uma estação;
* consultar o estado atual do ESP32;
* identificar se a estação já foi configurada;
* cadastrar/provisionar uma nova estação;
* atribuir um nome à estação;
* enviar a identificação e credencial para o ESP32;
* configurar SSID e senha da rede Wi-Fi;
* visualizar o estado da conexão Bluetooth;
* visualizar a rede Wi-Fi conectada;
* visualizar o endereço IP da estação;
* trocar posteriormente a rede Wi-Fi;
* configurar manualmente a rota do servidor durante os testes locais;
* desconectar corretamente do ESP32 ao sair da tela de configuração.

---

## Tecnologias

O aplicativo utiliza principalmente:

```text
React Native
Expo
Expo Router
TypeScript
react-native-ble-plx
```

O projeto utiliza **Expo Development Build**, pois a comunicação BLE depende de código nativo e não pode ser testada integralmente apenas através do Expo Go.

---

## Bluetooth Low Energy

A comunicação entre aplicativo e estação utiliza BLE.

O aplicativo procura dispositivos que anunciam o serviço utilizado pelo firmware CASA e estabelece uma conexão com a estação selecionada.

Após a conexão, os serviços e características BLE são descobertos e utilizados para troca de mensagens.

A implementação principal da comunicação está localizada em:

```text
services/ble.ts
```

ou no caminho equivalente dentro da estrutura atual do projeto.

Os UUIDs utilizados pela comunicação são mantidos separadamente no módulo correspondente de configuração BLE.

---

## Protocolo BLE

As mensagens trocadas entre aplicativo e ESP32 utilizam JSON.

Entre os comandos utilizados estão:

```text
get_status
save_identity
configure_wifi
```

### Consulta de estado

O aplicativo pode solicitar:

```json
{
  "command": "get_status"
}
```

A estação retorna informações como:

* hardware ID;
* device ID;
* estado do Bluetooth;
* estado do Wi-Fi;
* SSID conectado;
* endereço IP;
* existência ou não de credencial configurada.

---

## Provisionamento da estação

Quando uma estação ainda não possui uma identidade configurada, o aplicativo realiza seu cadastro junto ao backend CASA.

De forma simplificada:

```text
ESP32
  │
  │ hardware_id
  ▼
Aplicativo
  │
  │ cadastro
  ▼
Backend CASA
  │
  ├── device_id
  └── api_token
        │
        ▼
    Aplicativo
        │
        │ BLE
        ▼
      ESP32
```

O servidor gera um identificador interno semelhante a:

```text
CASA-000001
CASA-000002
CASA-000003
```

e uma credencial individual da estação.

O aplicativo envia essas informações ao ESP32 através do comando:

```text
save_identity
```

O firmware então armazena os dados persistentemente.

### Credencial

A credencial retornada durante o cadastro é exibida/transmitida somente durante o fluxo necessário de provisionamento.

Depois de configurada, uma estação não deve precisar solicitar uma nova credencial a cada abertura do aplicativo.

---

## Interface para o usuário

O identificador interno:

```text
CASA-XXXXXX
```

não precisa ser apresentado como informação principal ao usuário.

A interface utiliza preferencialmente o **nome atribuído à estação**.

Na tela de configuração são apresentadas informações como:

```text
Nome da estação

Bluetooth: conectado

Wi-Fi: <nome da rede>
IP: <endereço>
```

Caso não exista conexão Wi-Fi, os campos correspondentes podem ser apresentados como:

```text
Wi-Fi: ----
IP: ----
```

---

## Configuração Wi-Fi

Depois do provisionamento, o usuário pode configurar a rede utilizada pela estação.

O aplicativo solicita:

```text
SSID
Senha
```

e envia essas informações através de BLE.

O ESP32 então tenta conectar à rede especificada.

Os campos permanecem disponíveis mesmo quando a estação já está conectada, permitindo trocar de rede posteriormente sem reprogramar o dispositivo.

---

## Configuração da rota do servidor

Durante o desenvolvimento local existe uma configuração provisória para alterar manualmente a rota do servidor.

Ela permite que diferentes membros do projeto testem uma estação utilizando um backend executado em seus próprios computadores.

Por exemplo:

```text
http://192.168.x.x
```

Essa opção pode ser acessada pela interface de configuração da estação.

> Essa funcionalidade é provisória e deverá ser removida ou restringida quando o CASA estiver utilizando a infraestrutura definitiva em nuvem.

Em produção, o aplicativo deverá utilizar o endereço oficial do servidor.

---

## Variáveis de ambiente

O endereço padrão utilizado pelo aplicativo pode ser definido através das variáveis de ambiente do projeto.

O arquivo `.env` **não deve ser utilizado para armazenar segredos que serão protegidos dentro do APK**, pois valores necessários pelo aplicativo podem acabar incorporados à aplicação durante a build.

O endereço da API, por exemplo, não é uma credencial secreta.

Um ambiente local pode utilizar algo semelhante a:

```text
http://192.168.x.x
```

enquanto a versão de produção utilizará o domínio definitivo do CASA com HTTPS.

---

## Navegação

O aplicativo utiliza **Expo Router**.

O fluxo atual possui telas destinadas a responsabilidades diferentes, como:

```text
Busca de estações
       ↓
Conexão BLE
       ↓
Estação não configurada?
   │             │
  Sim           Não
   │             │
   ▼             │
Configuração     │
da estação       │
   │             │
   └──────┬──────┘
          ▼
   Configuração
      Wi-Fi
```

Uma estação já provisionada pode seguir diretamente para sua tela de configuração Wi-Fi, evitando repetir o cadastro.

---

## Desconexão BLE

Ao sair da tela de configuração da estação, a conexão BLE deve ser encerrada corretamente.

Isso é importante porque uma conexão anterior mantida aberta pode impedir ou dificultar uma nova conexão com o ESP32.

O fluxo esperado é:

```text
Usuário volta
     ↓
disconnect()
     ↓
conexão BLE encerrada
     ↓
estação disponível novamente
```

---

## Permissões Android

O aplicativo solicita permissões necessárias para utilização de Bluetooth em diferentes versões do Android.

Entre elas estão:

```text
BLUETOOTH
BLUETOOTH_ADMIN
BLUETOOTH_SCAN
BLUETOOTH_CONNECT
ACCESS_FINE_LOCATION
```

O tratamento varia conforme a versão do Android.

Em versões mais recentes são utilizadas principalmente:

```text
BLUETOOTH_SCAN
BLUETOOTH_CONNECT
```

enquanto versões anteriores podem exigir acesso à localização para descoberta BLE.

---

## Instalação do projeto

### Requisitos

É recomendado ter instalado:

```text
Node.js
npm
Expo
Android SDK
EAS CLI
```

Para desenvolvimento Android, também pode ser utilizado o Android Studio.

---

## Instalar dependências

Na raiz do projeto:

```bash
npm install
```

---

## Executar durante o desenvolvimento

Para iniciar o servidor Expo:

```bash
npx expo start
```

Como o projeto utiliza BLE nativo, os testes completos devem ser realizados utilizando uma **Development Build** instalada no dispositivo.

Quando necessário, o cache do Metro pode ser limpo com:

```bash
npx expo start --clear
```

---

## Development Build

O projeto pode possuir uma variante específica para desenvolvimento.

No `app.config.js`, a configuração diferencia os aplicativos de desenvolvimento e produção através de:

```text
APP_VARIANT
```

Isso permite, por exemplo, instalar simultaneamente:

```text
CASAS DEV
CASAS
```

no mesmo dispositivo, utilizando packages Android diferentes.

Essa separação é útil para evitar que uma build de desenvolvimento substitua a versão utilizada nos testes de campo.

---

## Configuração do aplicativo

As principais configurações Expo estão em:

```text
app.config.js
```

Esse arquivo define itens como:

* nome do aplicativo;
* versão;
* ícone;
* splash screen;
* package Android;
* permissões;
* plugins;
* Expo Router;
* configuração do `react-native-ble-plx`;
* identificação do projeto EAS.

---

## Ícone e splash screen

Os arquivos visuais do aplicativo ficam em:

```text
assets/images/
```

O `app.config.js` define as imagens utilizadas para:

```text
ícone do aplicativo
adaptive icon Android
splash screen
favicon web
```

Após alterações em configurações nativas, como ícone, splash screen, permissões ou plugins, normalmente é necessário gerar uma nova build para que as mudanças apareçam no APK instalado.

---

## Gerando APK

As builds Android são realizadas através do **EAS Build**.

Primeiro, caso necessário:

```bash
npm install -g eas-cli
```

Autentique:

```bash
eas login
```

Depois utilize o perfil configurado no:

```text
eas.json
```

Para gerar um APK destinado aos testes internos, utilize o perfil correspondente configurado no projeto, por exemplo:

```bash
eas build --platform android --profile preview
```

O perfil utilizado deve estar configurado para gerar um APK instalável quando a distribuição direta do arquivo for necessária.

> Consulte `eas.json` antes de executar a build, pois os nomes e configurações dos perfis podem mudar durante o desenvolvimento.

---

## Build de desenvolvimento

Quando for necessária uma nova Development Build com alterações nativas:

```bash
eas build --platform android --profile development
```

Depois de instalar a Development Build no celular, o código JavaScript/TypeScript pode ser desenvolvido normalmente utilizando o Metro/Expo.

---

## Diferença entre Development Build e APK de teste

### Development Build

Indicada durante desenvolvimento:

```text
Development Build
      +
npx expo start
      ↓
alterações rápidas
```

Permite testar mudanças no código sem gerar um APK completo a cada alteração.

### APK de teste

Indicado para outras pessoas do projeto:

```text
Build
  ↓
APK
  ↓
instalação
  ↓
aplicativo independente
```

Não depende do computador do desenvolvedor nem do Metro estar executando.

---

## Estrutura geral

A estrutura exata pode evoluir durante o desenvolvimento, mas o projeto segue uma separação semelhante a:

```text
app/
├── _layout.tsx
├── index.tsx
├── station.tsx
└── wifi.tsx

services/
├── ble.ts
├── ble-types.ts
└── bleUUID.ts

assets/
└── images/

app.config.js
eas.json
package.json
```

### `index.tsx`

Responsável pela descoberta e seleção das estações disponíveis.

### `station.tsx`

Responsável pelo fluxo de configuração inicial/provisionamento de uma estação ainda não configurada.

### `wifi.tsx`

Responsável pela visualização do estado da estação e configuração ou troca da rede Wi-Fi.

### `ble.ts`

Centraliza a comunicação Bluetooth com o ESP32.

### `ble-types.ts`

Define os tipos das mensagens recebidas através do protocolo BLE.

### `bleUUID.ts`

Centraliza os UUIDs utilizados pelo serviço BLE.

---

## Integração com o backend CASA

Durante o provisionamento, o aplicativo se comunica com a API do CASA para cadastrar uma nova estação.

Depois do cadastro, a comunicação periódica de medições ocorre diretamente:

```text
ESP32 → API CASA
```

e **não através do aplicativo**.

Isso significa que o aplicativo não precisa permanecer aberto para a estação funcionar.

Depois que Wi-Fi, identidade e credencial estiverem configurados, o ESP32 opera autonomamente.

---

## Papel de cada interface do CASA

O projeto possui interfaces com objetivos diferentes.

### Aplicativo React Native

Utilizado para:

```text
instalar
configurar
provisionar
trocar Wi-Fi
diagnosticar conexão básica
```

### Interface web React

Utilizada para:

```text
visualizar estações
consultar medições
visualizar gráficos
analisar histórico
acompanhar dados ambientais
```

Portanto, o aplicativo móvel não substitui a interface web.

---

## Testes realizados

O aplicativo já foi testado em cenários como:

* descoberta BLE;
* conexão com ESP32;
* leitura do status da estação;
* provisionamento;
* armazenamento da identidade no ESP32;
* identificação de estação já configurada;
* configuração Wi-Fi;
* troca de rede Wi-Fi;
* exibição de SSID e IP;
* alteração temporária da rota do servidor;
* desconexão BLE ao retornar;
* funcionamento através de Development Build;
* funcionamento através de APK independente;
* comunicação com firmware enviando posteriormente medições ao backend.

---

## Fluxo esperado no piloto

Para uma estação nova:

```text
Ligar estação
      ↓
Abrir aplicativo
      ↓
Encontrar estação
      ↓
Conectar por BLE
      ↓
Dar nome
      ↓
Configurar estação
      ↓
Backend cria identidade
      ↓
Identidade enviada ao ESP32
      ↓
Configurar Wi-Fi
      ↓
ESP32 conecta
      ↓
Estação pronta
```

Depois:

```text
Aplicativo pode ser fechado
           ↓
ESP32 continua funcionando
           ↓
Sensores
           ↓
Servidor CASA
           ↓
Interface web
```

---

## Próximas etapas

Entre as melhorias previstas estão:

* substituir definitivamente as rotas locais pela API de produção;
* remover a configuração manual provisória da rota;
* validar o aplicativo com todas as estações piloto;
* melhorar mensagens de diagnóstico para o usuário;
* revisar tratamento de erros de rede e BLE;
* preparar uma estratégia definitiva de distribuição do aplicativo;
* revisar identidade visual e experiência de instalação;
* adaptar o aplicativo conforme novas funcionalidades forem incorporadas ao firmware.

---

## Status atual

O aplicativo encontra-se em preparação para a **validação inicial com seis estações CASA**.

O fluxo essencial já está implementado:

```text
descoberta BLE
      ↓
conexão
      ↓
provisionamento
      ↓
configuração Wi-Fi
      ↓
operação autônoma da estação
```

A configuração manual da rota do servidor permanece temporariamente disponível para facilitar testes locais enquanto a infraestrutura definitiva em nuvem não está disponível.

Após o deploy de produção, o aplicativo poderá utilizar diretamente a rota oficial do CASA, simplificando ainda mais o processo de instalação das estações.
