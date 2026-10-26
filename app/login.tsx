import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useAccount } from "../src/accounts";
import { accountRequest } from "../src/account-api";
import { API_CONFIG } from "../src/config/api";

export default function Login() {
  const { login } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await login(email, password, code);
      setPassword("");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../assets/images/logo-2-transp.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Entre no CASA</Text>
        <Text style={styles.description}>
          Use a mesma conta do site. O cadastro de estações está disponível para
          a equipe do projeto.
        </Text>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="username"
          maxLength={254}
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          maxLength={128}
        />
        <Text style={styles.label}>
          Código de autenticação (administradores)
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoComplete="one-time-code"
          maxLength={64}
          placeholder="Autenticador ou código de recuperação"
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {notice ? <Text style={styles.description}>{notice}</Text> : null}
        <TouchableOpacity
          disabled={busy || !email || !password}
          style={[styles.button, busy && { opacity: 0.5 }]}
          onPress={submit}
        >
          <Text style={styles.buttonText}>{busy ? "Aguarde…" : "Entrar"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={busy || !email}
          onPress={async () => {
            setBusy(true);
            setError("");
            try {
              const result = await accountRequest<{ message: string }>(
                "/auth/forgot-password",
                "POST",
                { email: email.trim() },
              );
              setNotice(result.message);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Tente novamente.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Text style={styles.link}>Esqueci minha senha</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            void Linking.openURL(
              API_CONFIG.baseUrl.replace(/\/api\/?$/, ""),
            ).catch(() => setError("Não foi possível abrir o site."));
          }}
        >
          <Text style={styles.link}>Abrir o site do CASA</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          Ative sua conta pelo convite recebido por e-mail. Administradores
          também devem configurar o segundo fator no site.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f7fb" },
  content: { padding: 28, paddingTop: 55, gap: 10 },
  logo: { width: 65, height: 65, alignSelf: "center", marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "700", color: "#17324b" },
  description: { fontSize: 14, lineHeight: 22, color: "#52677c" },
  label: { fontWeight: "600", color: "#17324b", marginTop: 12 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#bdcedd",
    borderRadius: 8,
    padding: 13,
    color: "#17324b",
  },
  button: {
    backgroundColor: "#075db5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: { color: "white", fontWeight: "600" },
  link: { color: "#075db5", paddingVertical: 10 },
  error: { color: "#a32720", lineHeight: 22 },
});
