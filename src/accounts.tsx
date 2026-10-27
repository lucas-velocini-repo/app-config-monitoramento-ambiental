import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  accountRequest,
  AccountSession,
  onSessionExpired,
  setAccountToken,
} from "./account-api";
import BLEService from "./services/ble";

const KEY = "casa.account-session";
interface Accounts {
  session: AccountSession | null;
  login: (email: string, password: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<Accounts | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [checking, setChecking] = useState(true);
  const clear = useCallback(async () => {
    setAccountToken(null);
    setSession(null);
    await SecureStore.deleteItemAsync(KEY);
    BLEService.stopScan();
    await BLEService.disconnect().catch(() => {});
  }, []);
  useEffect(() => {
    let alive = true;
    onSessionExpired(() => {
      void clear();
    });
    async function restore() {
      try {
        const saved = await SecureStore.getItemAsync(KEY);
        if (saved) {
          setAccountToken(saved);
          const result = await accountRequest<AccountSession>("/auth/me");
          if (alive) setSession(result);
        }
      } catch {
        setAccountToken(null);
      } finally {
        if (alive) setChecking(false);
      }
    }
    void restore();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active")
        void accountRequest<AccountSession>("/auth/me")
          .then((result) => {
            if (alive) setSession(result);
          })
          .catch(() => {});
    });
    return () => {
      alive = false;
      onSessionExpired(null);
      subscription.remove();
    };
  }, [clear]);
  async function login(email: string, password: string, code: string) {
    const result = await accountRequest<AccountSession>("/auth/login", "POST", {
      email: email.trim(),
      password,
      mfa_code: code.trim(),
      client: "mobile",
    });
    if (result.mfa_setup_required) {
      if (result.token) {
        setAccountToken(result.token);
        await accountRequest("/auth/logout", "POST").catch(() => {});
        setAccountToken(null);
      }
      throw new Error(
        "Ative o segundo fator pelo site do CASA antes de entrar no aplicativo.",
      );
    }
    if (!result.token)
      throw new Error("O servidor não forneceu uma sessão válida.");
    await SecureStore.setItemAsync(KEY, result.token);
    setAccountToken(result.token);
    setSession(result);
  }
  async function logout() {
    // Revoke on the server before removing local credentials. Show connection failures to the user.
    await accountRequest("/auth/logout", "POST");
    await clear();
  }
  if (checking)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <Text>Verificando seu acesso…</Text>
      </View>
    );
  return (
    <Context.Provider value={{ session, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const context = useContext(Context);
  if (!context) throw new Error("AccountProvider indisponível");
  return context;
}
