import { Link, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bluetooth, CheckCircle2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Config() {
  const { name } = useLocalSearchParams();
  const moduleName = typeof name === "string" ? name : "Estação Meteorológica";
  const [route, setRoute] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function validateRoute(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    if (/\s/.test(trimmed)) {
      return false;
    }

    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    try {
      const parsed = new URL(url);
      if (!parsed.hostname) {
        return false;
      }
      return /^https?:$/i.test(parsed.protocol);
    } catch {
      return false;
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type);
    setMessage(text);
    translateAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 10,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMessage("");
        setMessageType("");
      });
    }, 3000);
  }

  function handleSubmit() {
    Keyboard.dismiss();

    if (!route.trim() || !ssid.trim() || !password.trim()) {
      showMessage("error", "Por favor preencha todos os campos.");
      return;
    }

    if (!validateRoute(route)) {
      showMessage("error", "Rota inválida. Informe uma URL válida.");
      return;
    }

    showMessage("success", "Dados enviados com sucesso!");
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo-2-transp.png")}
        style={styles.logo}
        resizeMode="contain"
      />
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
          value={route}
          onChangeText={setRoute}
          placeholder="ex: 192.168.1.50/data"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Wi-Fi</Text>
        <TextInput
          style={styles.input}
          value={ssid}
          onChangeText={setSsid}
          placeholder="Nome da rede"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="******"
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Bluetooth color="white" size={20} />
          <Text style={styles.buttonText}>Enviar via Bluetooth</Text>
        </TouchableOpacity>

        {message.length > 0 ? (
          <Animated.View
            style={[
              styles.feedbackBox,
              messageType === "success" ? styles.successBox : styles.errorBox,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              },
            ]}
          >
            <Text style={styles.feedbackText}>{message}</Text>
          </Animated.View>
        ) : null}
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
  feedbackBox: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  successBox: {
    backgroundColor: "rgba(52, 211, 153, 0.85)",
  },
  errorBox: {
    backgroundColor: "rgba(236, 102, 102, 0.99)",
  },
});
