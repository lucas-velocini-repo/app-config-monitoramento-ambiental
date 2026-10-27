import { useState } from "react";
import { Linking, Text, TextInput, TouchableOpacity } from "react-native";
import { useAccount } from "../src/accounts";
import { accountRequest } from "../src/account-api";
import { Screen, ui as styles } from "../src/components/Screen";
import { API_CONFIG } from "../src/config/api";

export default function Login() {
  const { login } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
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
    <Screen
      title="Entre no CASA"
      description="Use a mesma conta do site para acompanhar suas estações."
    >
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
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: showAdminCode }}
        onPress={() => {
          setShowAdminCode(!showAdminCode);
          setCode("");
        }}
      >
        <Text style={styles.link}>
          {showAdminCode
            ? "Ocultar código de administrador"
            : "Sou administrador"}
        </Text>
      </TouchableOpacity>
      {showAdminCode && (
        <>
          <Text style={styles.label}>Código de autenticação</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoComplete="one-time-code"
            maxLength={64}
            placeholder="Autenticador ou código de recuperação"
          />
        </>
      )}
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
        Ative sua conta pelo convite recebido por e-mail. Administradores também
        devem configurar o segundo fator no site.
      </Text>
    </Screen>
  );
}
