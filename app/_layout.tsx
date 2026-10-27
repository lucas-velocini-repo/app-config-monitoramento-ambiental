import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useEffect } from "react";
import BLEService from "../src/services/ble";
import { colors } from "../src/theme";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AccountProvider, useAccount } from "../src/accounts";

function Routes() {
  const { session } = useAccount();
  const pathname = usePathname();
  useEffect(() => {
    if (!["/station", "/wifi", "/config"].includes(pathname)) {
      void BLEService.disconnect().catch(() => {});
    }
  }, [pathname]);
  return (
    <ThemeProvider
      value={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
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
      <StatusBar
        style="dark"
        backgroundColor={colors.background}
        translucent={false}
      />
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
