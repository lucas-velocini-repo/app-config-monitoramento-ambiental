import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  requestInterval,
  StationConfiguration,
} from "../services/station-config";
import { ui } from "./Screen";
export function IntervalControl({
  deviceId,
  config,
  onChange,
}: {
  deviceId: number;
  config?: StationConfiguration;
  onChange: () => void;
}) {
  const [seconds, setSeconds] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <View style={ui.section}>
      <Text style={ui.label}>Intervalo de aquisição</Text>
      <Text style={ui.description}>
        Confirmado:{" "}
        {config?.reported_interval_seconds
          ? `${config.reported_interval_seconds} s`
          : "aguardando firmware compatível"}
      </Text>
      {config?.desired_interval_seconds != null && (
        <Text style={ui.description}>
          Solicitado: {config.desired_interval_seconds} s ·{" "}
          {config.pending ? "pendente" : "aplicado"}
        </Text>
      )}
      <Text style={ui.description}>
        A alteração chega pela internet. A estação consulta o servidor a cada
        minuto.
      </Text>
      <TextInput
        accessibilityLabel="Intervalo em segundos"
        style={ui.input}
        value={seconds}
        onChangeText={setSeconds}
        keyboardType="number-pad"
        placeholder="Segundos: 300 = 5 minutos"
        maxLength={5}
      />
      <TouchableOpacity
        style={[ui.button, busy && ui.disabled]}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setMessage("");
          try {
            await requestInterval(deviceId, Number(seconds));
            setMessage(
              "Intervalo solicitado. Aguarde a confirmação da estação.",
            );
            onChange();
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Não foi possível salvar.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={ui.buttonText}>
          {busy ? "Aguarde…" : "Solicitar intervalo"}
        </Text>
      </TouchableOpacity>
      {!!message && (
        <Text accessibilityRole="alert" style={ui.description}>
          {message}
        </Text>
      )}
    </View>
  );
}
