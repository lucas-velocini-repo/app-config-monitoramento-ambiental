import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AccountProvider, useAccount } from "../src/accounts";

function Routes() {
  const { session } = useAccount();
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected
          guard={session?.user.role === "admin" && !session.mfa_setup_required}
        >
          <Stack.Screen name="config" />
          <Stack.Screen name="station" />
          <Stack.Screen name="wifi" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
    </ThemeProvider>
  );
}
export default function RootLayout() {
  return (
    <AccountProvider>
      <Routes />
    </AccountProvider>
  );
}
