import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import BLEService from "../src/services/ble";
import { BLEMessage } from "../src/services/ble-types";
import {
  registerDevice,
  confirmProvisioning,
} from "../src/services/device-api";
import { Screen, ui } from "../src/components/Screen";
import { useStationBack } from "../src/hooks/use-station-back";

export default function Station() {
  const router = useRouter();
  const leave = useStationBack();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const moduleName = name || "Estação CASA";
  const [stationName, setStationName] = useState("");
  const [hardwareId, setHardwareId] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef(false);
  const pending = useRef<{ deviceId: string; token: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      BLEService.setConnectionCallback(setConnected);
      BLEService.setMessageCallback((raw) => {
        let data: BLEMessage;
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
        if (data.type === "status") {
          setHardwareId(data.hardwareId);
          if (data.deviceId && data.apiTokenConfigured)
            router.replace({ pathname: "/wifi", params: { name: moduleName } });
        }
        if (data.type === "identity_saved") {
          if (timer.current) clearTimeout(timer.current);
          setBusy(false);
          if (data.status === "ok") {
            setConfigured(true);
            pending.current = null;
            setMessage("Identidade salva. Continue para configurar o Wi-Fi.");
            if (data.deviceId)
              void confirmProvisioning(data.deviceId).catch(() =>
                setMessage(
                  "Identidade salva. A confirmação será concluída com o primeiro envio de dados.",
                ),
              );
          } else
            setMessage(data.message || "Não foi possível salvar a identidade.");
        }
      });
      void BLEService.getStatus().catch((e) => setMessage(e.message));
      return () => {
        active.current = false;
        if (timer.current) clearTimeout(timer.current);
        BLEService.setMessageCallback(null);
        BLEService.setConnectionCallback(null);
        // Moving to Wi-Fi preserves BLE. Leaving the flow disconnects in the root/home.
      };
    }, [moduleName, router]),
  );
  async function configure() {
    if (!connected || !hardwareId || !stationName.trim()) {
      setMessage("Conecte a estação e informe um nome.");
      return;
    }
    const connectionKey = BLEService.connectionKey;
    setBusy(true);
    setMessage("");
    try {
      if (!pending.current) {
        const registered = await registerDevice(hardwareId, stationName.trim());
        if (!registered.api_token)
          throw new Error(
            "Esta estação já está cadastrada. Reconecte para conferir a identidade salva.",
          );
        pending.current = {
          deviceId: registered.device_id,
          token: registered.api_token,
        };
      }
      if (!active.current || connectionKey !== BLEService.connectionKey)
        throw new Error(
          "A conexão mudou. Reconecte a estação antes de continuar.",
        );
      timer.current = setTimeout(() => {
        setBusy(false);
        setMessage(
          "A estação não confirmou a gravação. Tente novamente ou reconecte.",
        );
      }, 12000);
      await BLEService.saveIdentity(
        pending.current.deviceId,
        pending.current.token,
      );
    } catch (e) {
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      setMessage(
        e instanceof Error ? e.message : "Não foi possível cadastrar.",
      );
    }
  }
  return (
    <Screen title="Configurar estação" description={moduleName} onBack={leave}>
      <View style={ui.secondary}>
        <Text style={ui.label}>
          {connected ? "Bluetooth conectado" : "Bluetooth desconectado"}
        </Text>
        {!!hardwareId && (
          <Text style={ui.description}>Hardware: {hardwareId}</Text>
        )}
      </View>
      {!configured ? (
        <View style={ui.section}>
          <Text style={ui.label}>Nome da estação</Text>
          <TextInput
            style={ui.input}
            value={stationName}
            onChangeText={setStationName}
            placeholder="Ex.: Estação Sala"
            maxLength={100}
          />
          <TouchableOpacity
            disabled={busy || !connected}
            style={[ui.button, (busy || !connected) && ui.disabled]}
            onPress={() => {
              void configure();
            }}
          >
            <Text style={ui.buttonText}>
              {busy ? "Configurando…" : "Cadastrar estação"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={ui.button}
          onPress={() =>
            router.replace({
              pathname: "/wifi",
              params: { name: stationName.trim() || moduleName },
            })
          }
        >
          <Text style={ui.buttonText}>Continuar para Wi-Fi</Text>
        </TouchableOpacity>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={ui.description}>
          {message}
        </Text>
      )}
    </Screen>
  );
}
