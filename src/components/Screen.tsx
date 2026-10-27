import { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../theme";

export function Screen({
  title,
  description,
  onBack,
  children,
}: {
  title: string;
  description?: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              accessibilityLabel="T2P — Tecnologia que cuida"
              source={require("../../assets/images/t2p-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>CASA</Text>
          </View>
          <View style={styles.card}>
            {onBack && (
              <TouchableOpacity
                accessibilityLabel="Voltar e desconectar estação"
                style={styles.back}
                onPress={onBack}
              >
                <ArrowLeft color={colors.primary} size={20} />
                <Text style={ui.link}>Voltar</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={ui.description}>{description}</Text>}
            {children}
          </View>
          <Text style={styles.footer}>
            Central de Acompanhamento de Saúde e Ambiente
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export const ui = StyleSheet.create({
  section: { gap: 12, marginTop: 22 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  description: { fontSize: 14, lineHeight: 22, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 13,
    fontSize: 16,
    minHeight: 48,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonText: { color: "white", fontSize: 15, fontWeight: "600" },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    backgroundColor: "#f8fbfd",
  },
  link: { color: colors.primary, fontSize: 14, paddingVertical: 10 },
  error: { color: colors.error, lineHeight: 22 },
  success: { color: colors.success, lineHeight: 22 },
  disabled: { opacity: 0.5 },
});
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 20,
    gap: 18,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: 150, height: 82 },
  brand: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    gap: 12,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  title: { color: colors.text, fontSize: 26, fontWeight: "700" },
  footer: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    color: colors.muted,
    paddingBottom: 12,
  },
});
