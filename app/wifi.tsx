import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import {
    ArrowLeft,
    Bluetooth,
    CheckCircle2,
    Settings,
    Wifi,
} from "lucide-react-native";

import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    useEffect,
    useState,
} from "react";

import { API_CONFIG } from "../src/config/api";
import BLEService from "../src/services/ble";
import { BLEMessage } from "../src/services/ble-types";


export default function WifiConfig() {

  const router = useRouter();

  const { name } =
    useLocalSearchParams();

  const stationName =
    typeof name === "string"
      ? name
      : "Estação";


  const [ssid, setSsid] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    bluetoothConnected,
    setBluetoothConnected,
  ] = useState(false);

  const [
    wifiConnected,
    setWifiConnected,
  ] = useState(false);

  const [
    connectedSsid,
    setConnectedSsid,
  ] = useState("");

  const [ip, setIp] =
    useState("");

  const [
    connecting,
    setConnecting,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] = useState<
    "success" | "error" | "info"
  >("info");

  const [
    serverModalVisible,
    setServerModalVisible,
    ] = useState(false);

    const [
    serverRoute,
    setServerRoute,
    ] = useState(
    API_CONFIG.measurementsUrl
    );

    const [
    savingServer,
    setSavingServer,
    ] = useState(false);


  useEffect(() => {

    BLEService.setMessageCallback(
      (message) => {

        try {

          const data =
            JSON.parse(
              message
            ) as BLEMessage;


          switch (data.type) {

            case "status":

              setBluetoothConnected(
                data.bluetooth
              );

              setWifiConnected(
                data.wifiConnected
              );

              setConnectedSsid(
                data.wifiConnected
                  ? data.ssid
                  : ""
              );

              setIp(
                data.wifiConnected
                  ? data.ip
                  : ""
              );


              if (
                data.wifiConnected
                && connecting
              ) {

                setConnecting(false);

                setMessageType(
                  "success"
                );

                setMessage(
                  "Wi-Fi configurado com sucesso."
                );
              }

              break;


            case "configure_result":

              if (
                data.status === "ok"
              ) {

                setMessageType(
                  "info"
                );

                setMessage(
                  "Configuração recebida. Verificando conexão..."
                );

              }
              else {

                setConnecting(false);

                setMessageType(
                  "error"
                );

                setMessage(
                  data.message ??
                  "Não foi possível configurar o Wi-Fi."
                );
              }

              break;

            case "server_saved":

                setSavingServer(false);

                if (data.status === "ok") {

                    setServerModalVisible(
                    false
                    );

                    setMessageType(
                    "success"
                    );

                    setMessage(
                    "Rota do servidor atualizada com sucesso."
                    );

                }
                else {

                    setMessageType(
                    "error"
                    );

                    setMessage(
                    data.message ??
                    "Não foi possível atualizar a rota do servidor."
                    );

                }

                break;
          }

        }
        catch (error) {

          console.error(
            "Erro ao processar mensagem BLE:",
            error
          );

        }

      }
    );


    BLEService.setConnectionCallback(
      (connected) => {

        setBluetoothConnected(
          connected
        );

        if (!connected) {

          setConnecting(false);

          setWifiConnected(false);

          setConnectedSsid("");
          setIp("");

          setMessageType("error");

          setMessage(
            "Bluetooth desconectado."
          );
        }

      }
    );


    void BLEService.getStatus().catch(e => { setMessageType("error"); setMessage(e instanceof Error ? e.message : "Não foi possível consultar a estação."); });


    return () => {

      BLEService.setMessageCallback(
        () => {}
      );

    };

  }, [connecting]);


  async function configureWifi() {

    if (!bluetoothConnected) {

      setMessageType("error");

      setMessage(
        "A estação não está conectada por Bluetooth."
      );

      return;
    }


    if (!ssid.trim()) {

      setMessageType("error");

      setMessage(
        "Informe o nome da rede Wi-Fi."
      );

      return;
    }


    if (!password) {

      setMessageType("error");

      setMessage(
        "Informe a senha da rede Wi-Fi."
      );

      return;
    }


    setConnecting(true);

    setMessageType("info");

    setMessage(
      "Enviando configuração para a estação..."
    );


    try {

      await BLEService.configureWifi(
        ssid.trim(),
        password,
        API_CONFIG.measurementsUrl
      );

    }
    catch (error) {

      console.error(
        "Erro ao configurar Wi-Fi:",
        error
      );

      setConnecting(false);

      setMessageType("error");

      setMessage(
        "Não foi possível enviar a configuração Wi-Fi."
      );

    }

  }


  async function handleBack() {

    try {

      await BLEService.disconnect();

    }
    catch (error) {

      console.error(
        "Erro ao desconectar Bluetooth:",
        error
      );

    }
    finally {

      router.replace("/");

    }

  }


  async function finishConfiguration() {

    try {

      await BLEService.disconnect();

    }
    catch (error) {

      console.error(
        "Erro ao desconectar Bluetooth:",
        error
      );

    }
    finally {

      router.replace("/");

    }

  }

  async function saveServerRoute() {

    let route =
        serverRoute.trim();

    if (!route) {

        setMessageType("error");

        setMessage(
        "Informe a rota do servidor."
        );

        return;
    }


    /*
    * Permite que o usuário digite apenas:
    *
    * 192.168.15.10:8000
    *
    * em vez da URL completa.
    */
    if (
        !route.startsWith("http://")
        && !route.startsWith("https://")
    ) {
        route =
        `http://${route}`;
    }


    /*
    * O ESP precisa da rota completa
    * onde fará o POST.
    */
    route =
        route.replace(/\/+$/, "");

    if (
        !route.endsWith(
        "/measurements"
        )
    ) {
        route +=
        "/measurements";
    }


    setServerRoute(route);

    setSavingServer(true);


    try {

        await BLEService.saveServer(
        route
        );

    }
    catch (error) {

        console.error(
        "Erro ao salvar rota:",
        error
        );

        setSavingServer(false);

        setMessageType("error");

        setMessage(
        "Não foi possível enviar a rota para a estação."
        );

    }

    }


  return (

    <View style={styles.container}>

      <Image
        source={require(
          "../assets/images/logo-2-transp.png"
        )}
        style={styles.logo}
        resizeMode="contain"
      />


      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >

          <ArrowLeft
            color="#0056b3"
            size={20}
          />

        </TouchableOpacity>


        <Text style={styles.pageTitle}>
          Configurar Wi-Fi
        </Text>

      </View>


      <View style={styles.stationCard}>

        <View style={styles.stationTopRow}>

          <View style={styles.stationInfo}>

            <Text style={styles.cardLabel}>
              Estação
            </Text>

            <Text
              style={styles.stationName}
              numberOfLines={1}
            >
              {stationName}
            </Text>

          </View>


          <View style={styles.bluetoothStatus}>

            {bluetoothConnected ? (

              <CheckCircle2
                color="#22c55e"
                size={20}
              />

            ) : (

              <Bluetooth
                color="#ef4444"
                size={20}
              />

            )}

            <Text
              style={[
                styles.bluetoothText,

                bluetoothConnected
                  ? styles.bluetoothConnected
                  : styles.bluetoothDisconnected,
              ]}
            >

              {bluetoothConnected
                ? "Bluetooth conectado"
                : "Bluetooth desconectado"}

            </Text>

          </View>

        </View>


        <View style={styles.networkRow}>

          <View style={styles.networkItem}>

            <Text style={styles.infoLabel}>
              Wi-Fi
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {wifiConnected
                ? connectedSsid
                : "----"}
            </Text>

          </View>


          <View style={styles.networkItem}>

            <Text style={styles.infoLabel}>
              IP
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {wifiConnected
                ? ip
                : "----"}
            </Text>

          </View>

        </View>

      </View>


      <View style={styles.form}>

        <Text style={styles.description}>
          Informe a rede Wi-Fi que será
          utilizada pela estação.
        </Text>


        <Text style={styles.label}>
          Rede Wi-Fi
        </Text>

        <TextInput
          style={styles.input}
          value={ssid}
          onChangeText={setSsid}
          placeholder="Nome da rede"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
        />


        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Senha da rede"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#0056b3"
        />


        <TouchableOpacity
          style={[
            styles.button,

            connecting &&
              styles.buttonDisabled,
          ]}
          disabled={connecting}
          onPress={configureWifi}
        >

          <Wifi
            color="#ffffff"
            size={19}
          />

          <Text style={styles.buttonText}>

            {connecting
              ? "Conectando..."
              : wifiConnected
                ? "Trocar rede Wi-Fi"
                : "Conectar à rede"}

          </Text>

        </TouchableOpacity>

      </View>


      {message.length > 0 && (

        <View
          style={[
            styles.messageBox,

            messageType === "success" &&
              styles.messageSuccess,

            messageType === "error" &&
              styles.messageError,

            messageType === "info" &&
              styles.messageInfo,
          ]}
        >

          <Text
            style={[
              styles.messageText,

              messageType === "success" &&
                styles.messageTextSuccess,

              messageType === "error" &&
                styles.messageTextError,

              messageType === "info" &&
                styles.messageTextInfo,
            ]}
          >
            {message}
          </Text>

        </View>

      )}


      {wifiConnected && (

        <TouchableOpacity
          style={styles.finishButton}
          onPress={finishConfiguration}
        >

          <Text style={styles.finishButtonText}>
            Finalizar configuração
          </Text>

        </TouchableOpacity>

      )}

      <TouchableOpacity
        style={styles.serverSettingsButton}
        onPress={() =>
            setServerModalVisible(true)
        }
        >
        <Settings
            size={18}
            color="#64748b"
        />
        </TouchableOpacity>

        <Modal
            transparent
            animationType="fade"
            visible={serverModalVisible}
            onRequestClose={() =>
                setServerModalVisible(false)
            }
            >

            <Pressable
                style={styles.modalOverlay}
                onPress={() =>
                setServerModalVisible(false)
                }
            >

                <Pressable
                style={styles.modalCard}
                onPress={() => {}}
                >

                <Text style={styles.modalTitle}>
                    Rota do servidor
                </Text>

                <Text style={styles.modalDescription}>
                    Configuração temporária para testes locais.
                </Text>


                <TextInput
                    style={styles.serverInput}
                    value={serverRoute}
                    onChangeText={setServerRoute}
                    placeholder="192.168.1.10:8000"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                />


                <TouchableOpacity
                    style={[
                    styles.button,

                    savingServer &&
                        styles.buttonDisabled,
                    ]}
                    disabled={savingServer}
                    onPress={saveServerRoute}
                >

                    <Text style={styles.buttonText}>

                    {savingServer
                        ? "Salvando..."
                        : "Salvar rota"}

                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() =>
                    setServerModalVisible(false)
                    }
                >

                    <Text style={styles.modalCancelText}>
                    Cancelar
                    </Text>

                </TouchableOpacity>

                </Pressable>

            </Pressable>

            </Modal>

    </View> 

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    paddingTop: 35,
    backgroundColor: "#f8fafc",
  },


  logo: {
    width: 40,
    height: 40,
    position: "absolute",
    top: 35,
    right: 20,
  },


  header: {
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },


  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
  },


  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 5,
  },


  stationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 22,
  },


  stationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },


  stationInfo: {
    flex: 1,
    marginRight: 15,
  },


  cardLabel: {
    fontSize: 12,
    color: "#64748b",
  },


  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },


  bluetoothStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },


  bluetoothText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "500",
  },


  bluetoothConnected: {
    color: "#166534",
  },


  bluetoothDisconnected: {
    color: "#991b1b",
  },


  networkRow: {
    flexDirection: "row",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },


  networkItem: {
    flex: 1,
  },


  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 3,
  },


  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },


  form: {
    gap: 10,
  },


  description: {
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 20,
  },


  label: {
    fontWeight: "600",
    color: "#1e293b",
  },


  input: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 5,

    /*
     * Importante no Android:
     * evita que os caracteres da senha
     * fiquem invisíveis.
     */
    color: "#0f172a",
    fontSize: 16,
  },


  button: {
    backgroundColor: "#0056b3",
    padding: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },


  buttonDisabled: {
    opacity: 0.6,
  },


  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },


  messageBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },


  messageSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },


  messageError: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
  },


  messageInfo: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },


  messageText: {
    textAlign: "center",
    fontWeight: "500",
  },


  messageTextSuccess: {
    color: "#166534",
  },


  messageTextError: {
    color: "#991b1b",
  },


  messageTextInfo: {
    color: "#1e40af",
  },


  finishButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },


  finishButtonText: {
    color: "#0056b3",
    fontWeight: "600",
  },

  serverSettingsButton: {
  position: "absolute",
  right: 18,
  bottom: 18,

  width: 40,
  height: 40,

  borderRadius: 20,

  backgroundColor: "#ffffff",

  alignItems: "center",
  justifyContent: "center",

  borderWidth: 1,
  borderColor: "#e2e8f0",

  elevation: 3,
},


modalOverlay: {
  flex: 1,

  backgroundColor:
    "rgba(0, 0, 0, 0.35)",

  justifyContent: "center",

  padding: 24,
},


modalCard: {
  backgroundColor: "#ffffff",

  borderRadius: 14,

  padding: 20,
},


modalTitle: {
  fontSize: 18,

  fontWeight: "bold",

  color: "#0f172a",

  marginBottom: 5,
},


modalDescription: {
  color: "#64748b",

  marginBottom: 15,
},


serverInput: {
  backgroundColor: "#f8fafc",

  padding: 12,

  borderRadius: 8,

  borderWidth: 1,

  borderColor: "#e2e8f0",

  color: "#0f172a",

  fontSize: 15,
},


modalCancelButton: {
  padding: 12,

  alignItems: "center",

  marginTop: 5,
},


modalCancelText: {
  color: "#64748b",

  fontWeight: "500",
},

});