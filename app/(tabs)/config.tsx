import { Bluetooth, CheckCircle2 } from "lucide-react-native";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Config() {
  return (
    <View style={styles.container}>
      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.labelHeader}>Módulo</Text>
          <Text style={styles.valueHeader}>Estação Meteorológica 1</Text>
        </View>
        <View style={styles.statusBadge}>
          <CheckCircle2 color="#22c55e" size={20} />
          <Text style={{ marginLeft: 5 }}>Conectado</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Rota do Servidor</Text>
        <TextInput style={styles.input} placeholder="ex: 192.168.1.50/data" />

        <Text style={styles.label}>Wi-Fi</Text>
        <TextInput style={styles.input} placeholder="Nome da rede" />

        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} secureTextEntry placeholder="******" />

        <TouchableOpacity style={styles.button}>
          <Bluetooth color="white" size={20} />
          <Text style={styles.buttonText}>Enviar via Bluetooth</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8fafc" },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  labelHeader: { fontSize: 12, color: "#64748b" },
  valueHeader: { fontSize: 16, fontWeight: "bold" },
  statusBadge: { flexDirection: "row", alignItems: "center" },
  form: { gap: 10 },
  label: { fontWeight: "600", color: "#1e293b" },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  button: {
    backgroundColor: "#0056b3",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold", marginLeft: 10 },
});
