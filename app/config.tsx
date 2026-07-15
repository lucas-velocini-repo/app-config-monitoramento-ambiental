import { Link, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bluetooth, CheckCircle2 } from "lucide-react-native";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Config() {
  const { name } = useLocalSearchParams();
  const moduleName = typeof name === "string" ? name : "Estação Meteorológica";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Link href="/" style={styles.backButton} replace>
          <ArrowLeft color="#0056b3" size={20} />
        </Link>
        <Text style={styles.pageTitle}>Configurações</Text>
      </View>

      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.labelHeader}>Módulo</Text>
          <Text style={styles.valueHeader}>{moduleName}</Text>
        </View>
        <View style={styles.statusBadge}>
          <CheckCircle2 color="#22c55e" size={20} />
          <Text style={{ marginLeft: 5 }}>Conectado</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Rota do Servidor</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: 192.168.1.50/data"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Wi-Fi</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da rede"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="******"
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity style={styles.button}>
          <Bluetooth color="white" size={20} />
          <Text style={styles.buttonText}>Enviar via Bluetooth</Text>
        </TouchableOpacity>
      </View>
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
  backText: { color: "#0056b3", marginLeft: 5, fontWeight: "600" },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginTop: 5,
  },
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
