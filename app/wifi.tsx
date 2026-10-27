import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen, ui } from "../src/components/Screen";
import { API_CONFIG } from "../src/config/api";
import { useStationBack } from "../src/hooks/use-station-back";
import BLEService from "../src/services/ble";
import { BLEMessage } from "../src/services/ble-types";

export default function WifiConfig() {
  const leave = useStationBack();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [connected, setConnected] = useState(false);
  const [wifi, setWifi] = useState({ connected: false, ssid: "", ip: "" });
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState(API_CONFIG.measurementsUrl);
  const [showServer, setShowServer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useFocusEffect(
    useCallback(() => {
      BLEService.setConnectionCallback((value) => {
        setConnected(value);
        if (!value) {
          setBusy(false);
          setMessage("Bluetooth desconectado. Volte e conecte novamente.");
        }
      });
      BLEService.setMessageCallback((raw) => {
        let data: BLEMessage;
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
        if (data.type === "status") {
          setWifi({
            connected: data.wifiConnected,
            ssid: data.ssid,
            ip: data.ip,
          });
          if (data.wifiConnected) setMessage("Estação conectada à rede Wi-Fi.");
        }
        if (data.type === "configure_result" || data.type === "server_saved") {
          if (timer.current) clearTimeout(timer.current);
          setBusy(false);
          if (data.status === "ok") {
            setPassword("");
            setMessage(
              data.type === "server_saved"
                ? "Rota do servidor salva."
                : "Configuração recebida. Verificando a rede…",
            );
            if (data.type === "configure_result")
              void BLEService.getStatus().catch((e) => setMessage(e.message));
          } else
            setMessage(
              data.message || "Não foi possível aplicar a configuração.",
            );
        }
      });
      void BLEService.getStatus().catch((e) => setMessage(e.message));
      return () => {
        if (timer.current) clearTimeout(timer.current);
        BLEService.setMessageCallback(null);
        BLEService.setConnectionCallback(null);
      };
    }, []),
  );
  function serverUrl() {
    const value = server.trim();
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(
        "Informe a URL completa do servidor, começando por http:// ou https://.",
      );
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("Rota do servidor inválida.");
    return value.replace(/\/+$/, "");
  }
  async function send(saveOnly: boolean) {
    setBusy(true);
    setMessage("");
    try {
      let route = serverUrl();
      if (!route.endsWith("/measurements")) route += "/measurements";
      setServer(route);
      if (!saveOnly && (!ssid.trim() || !password))
        throw new Error("Informe o nome e a senha da rede Wi-Fi.");
      timer.current = setTimeout(() => {
        setBusy(false);
        setMessage(
          "Sem confirmação da estação. Consulte o estado ou tente novamente.",
        );
      }, 30000);
      if (saveOnly) await BLEService.saveServer(route);
      else await BLEService.configureWifi(ssid.trim(), password, route);
    } catch (e) {
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      setMessage(e instanceof Error ? e.message : "Não foi possível enviar.");
    }
  }
  return (
    <Screen
      title="Configurar Wi-Fi"
      description={name || "Estação CASA"}
      onBack={leave}
    >
      <View style={ui.secondary}>
        <Text style={ui.label}>
          {connected ? "Bluetooth conectado" : "Bluetooth desconectado"}
        </Text>
        <Text style={ui.description}>
          Wi-Fi: {wifi.connected ? wifi.ssid : "desconectado"}
        </Text>
        {!!wifi.ip && <Text style={ui.description}>IP: {wifi.ip}</Text>}
      </View>
      <View style={ui.section}>
        <Text style={ui.label}>Rede Wi-Fi</Text>
        <TextInput
          style={ui.input}
          value={ssid}
          onChangeText={setSsid}
          placeholder="Nome da rede"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
        />
        <Text style={ui.label}>Senha da rede</Text>
        <TextInput
          style={ui.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Senha do Wi-Fi"
          autoCapitalize="none"
          maxLength={63}
        />
        <TouchableOpacity
          style={[ui.button, (busy || !connected) && ui.disabled]}
          disabled={busy || !connected}
          onPress={() => {
            void send(false);
          }}
        >
          <Text style={ui.buttonText}>
            {busy ? "Aguarde…" : "Salvar Wi-Fi"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowServer(!showServer)}>
          <Text style={ui.link}>
            {showServer
              ? "Ocultar rota do servidor"
              : "Alterar rota do servidor"}
          </Text>
        </TouchableOpacity>
        {showServer && (
          <>
            <Text style={ui.label}>URL de envio das medições</Text>
            <TextInput
              style={ui.input}
              value={server}
              onChangeText={setServer}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              disabled={busy || !connected}
              style={ui.button}
              onPress={() => {
                void send(true);
              }}
            >
              <Text style={ui.buttonText}>Salvar somente a rota</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={ui.description}>
          Para alterar o intervalo de aquisição, volte à lista de estações
          cadastradas. A alteração chega à estação pela internet.
        </Text>
        <TouchableOpacity onPress={leave}>
          <Text style={ui.link}>Concluir e desconectar</Text>
        </TouchableOpacity>
      </View>
      {!!message && (
        <Text accessibilityRole="alert" style={ui.description}>
          {message}
        </Text>
      )}
    </Screen>
  );
}
