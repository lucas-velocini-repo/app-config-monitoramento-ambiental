import { useFocusEffect, useRouter } from "expo-router";
import { AlertCircle, Bluetooth } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAccount } from "../src/accounts";
import { accountRequest, requireAdmin } from "../src/account-api";
import { API_CONFIG } from "../src/config/api";
import BLEService from "../src/services/ble";

export default function Home() {
  const router = useRouter();
  const { session, logout } = useAccount();
  const isAdmin = session?.user.role === "admin";
  const [error, setError] = useState("");
  const [myStations, setMyStations] = useState<
    { device_id: string; name: string }[]
  >([]);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        let live = true;
        accountRequest<{ device_id: string; name: string }[]>("/devices")
          .then((rows) => {
            if (live) setMyStations(rows);
          })
          .catch((e) => {
            if (live) setError(e.message);
          });
        return () => {
          live = false;
        };
      }
      let alive = true;
      async function initializeBLE() {
        try {
          await requireAdmin();
          if (!alive) return;

          const ok = await BLEService.requestPermissions();

          if (!ok) {
            return;
          }

          await BLEService.startScan((device) => {
            setDevices((old) => {
              const exists = old.find((d) => d.id === device.id);

              if (exists) {
                return old;
              }

              return [...old, device];
            });
          });
        } catch (e) {
          if (alive)
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível procurar estações.",
            );
        }
      }

      setDevices([]);
      initializeBLE();

      return () => {
        alive = false;
        BLEService.stopScan();
      };
    }, [isAdmin]),
  );

  async function handleSelectDevice(device: { id: string; name: string }) {
    try {
      await requireAdmin();
      BLEService.stopScan();
      await BLEService.connect(device.id);

      router.push({
        pathname: "/station",
        params: {
          id: device.id,
          name: device.name,
        },
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível conectar.",
      );
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo-2-transp.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Olá, {session?.user.name}!</Text>
      <TouchableOpacity
        onPress={() => {
          void logout().catch((e) => setError(e.message));
        }}
      >
        <Text style={{ color: "#075db5", paddingVertical: 12 }}>
          Sair da conta
        </Text>
      </TouchableOpacity>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{ color: "#a32720", marginBottom: 12 }}
        >
          {error}
        </Text>
      ) : null}
      <Text style={styles.subtitle}>
        {isAdmin
          ? "Conecte-se a um módulo disponível:"
          : "Consulte as estações vinculadas à sua conta pelo site do CASA."}
      </Text>
      {!isAdmin && (
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            void Linking.openURL(
              API_CONFIG.baseUrl.replace(/\/api\/?$/, ""),
            ).catch(() => setError("Não foi possível abrir o site."));
          }}
        >
          <Text style={styles.cardText}>Abrir minhas estações no site</Text>
        </TouchableOpacity>
      )}

      {!isAdmin ? (
        <FlatList
          data={myStations}
          keyExtractor={(item) => item.device_id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma estação vinculada.</Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#dce7f0",
                },
              ]}
            >
              <Text style={{ color: "#17324b", fontWeight: "600" }}>
                {item.name} · {item.device_id}
              </Text>
            </View>
          )}
        />
      ) : devices.length > 0 ? (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectDevice(item)}
            >
              <Bluetooth color="#ffffff" size={24} />
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <AlertCircle color="#ef4444" size={48} />
          <Text style={styles.emptyText}>Nenhum módulo encontrado.</Text>
          <Text style={styles.checklist}>
            • Verifique se o módulo está na tomada.{"\n"}• Verifique se o
            Bluetooth está ativado.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#f8fafc",
  },
  logo: {
    width: 40,
    height: 40,
    position: "absolute",
    top: 55,
    right: 20,
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#0056b3" },
  subtitle: { fontSize: 16, color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#0057b3de",
    height: 70,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 0,
  },
  cardText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: "600", marginTop: 10 },
  checklist: {
    marginTop: 15,
    color: "#64748b",
    lineHeight: 22,
    textAlign: "center",
  },
});
