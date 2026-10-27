import { useFocusEffect, useRouter } from "expo-router";
import { Bluetooth, Radio } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useAccount } from "../src/accounts";
import { accountRequest, requireAdmin } from "../src/account-api";
import { API_CONFIG } from "../src/config/api";
import BLEService, { DiscoveredStation } from "../src/services/ble";
import { Screen, ui } from "../src/components/Screen";
import { IntervalControl } from "../src/components/IntervalControl";
import {
  listConfigurations,
  StationConfiguration,
} from "../src/services/station-config";
import { colors } from "../src/theme";

type Station = { id: number; device_id: string; name: string; active: boolean };
export default function Home() {
  const router = useRouter();
  const { session, logout } = useAccount();
  const isAdmin = session?.user.role === "admin";
  const [error, setError] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [configs, setConfigs] = useState<StationConfiguration[]>([]);
  const [devices, setDevices] = useState<DiscoveredStation[]>([]);
  const [editingInterval, setEditingInterval] = useState<number | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const connectingRef = useRef(false);
  const focused = useRef(false);
  const [scanRevision, setScanRevision] = useState(0);
  const refresh = useCallback(async () => {
    const [rows, configRows] = await Promise.all([
      accountRequest<Station[]>("/devices"),
      isAdmin ? listConfigurations() : Promise.resolve([]),
    ]);
    if (focused.current) {
      setStations(rows);
      setConfigs(configRows);
    }
  }, [isAdmin]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      let alive = true;
      setError("");
      setDevices([]);
      setConnecting(null);
      connectingRef.current = false;
      async function initialize() {
        try {
          // Native back, gestures and programmatic navigation all return through here.
          await BLEService.disconnect();
          if (!alive) return;
          await refresh();
          if (!isAdmin || !alive) return;
          await requireAdmin();
          if (!alive || !(await BLEService.requestPermissions())) return;
          if (!alive) return;
          await BLEService.startScan(
            (device) => {
              if (alive)
                setDevices((old) => {
                  const previous = old.find((d) => d.id === device.id);
                  if (previous?.name === device.name) return old;
                  return previous
                    ? old.map((d) => (d.id === device.id ? device : d))
                    : [...old, device];
                });
            },
            (e) => {
              if (alive) setError(e.message);
            },
          );
        } catch (e) {
          if (alive)
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível carregar o CASA.",
            );
        }
      }
      void initialize();
      const timer = setInterval(() => {
        void refresh().catch(() => {});
      }, 30000);
      return () => {
        alive = false;
        focused.current = false;
        clearInterval(timer);
        BLEService.stopScan();
      };
      // The counter intentionally restarts scanning after a retry or a connection failure.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, refresh, scanRevision]),
  );
  async function select(device: DiscoveredStation) {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setConnecting(device.id);
    setError("");
    try {
      await requireAdmin();
      if (!focused.current) return;
      await BLEService.connect(device.id);
      if (!focused.current) {
        await BLEService.disconnect();
        return;
      }
      router.push({
        pathname: "/station",
        params: { id: device.id, name: device.name },
      });
    } catch (e) {
      if (focused.current) {
        setError(e instanceof Error ? e.message : "Não foi possível conectar.");
        setScanRevision((v) => v + 1);
      }
    } finally {
      connectingRef.current = false;
      setConnecting(null);
    }
  }
  return (
    <Screen
      title={`Olá, ${session?.user.name}!`}
      description={
        isAdmin
          ? "Gerencie suas estações e configure módulos próximos."
          : "Acompanhe as estações vinculadas à sua conta."
      }
    >
      <TouchableOpacity
        onPress={() => {
          void logout().catch((e) => setError(e.message));
        }}
      >
        <Text style={ui.link}>Sair da conta</Text>
      </TouchableOpacity>
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {isAdmin && (
        <View style={ui.section}>
          <Text style={ui.label}>Estações próximas · Bluetooth</Text>
          <Text style={ui.description}>
            O identificador abaixo do nome diferencia os módulos.
          </Text>
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              disabled={connecting !== null}
              style={ui.secondary}
              onPress={() => {
                void select(device);
              }}
            >
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <Bluetooth color={colors.primary} size={22} />
                <Text style={ui.label}>
                  {connecting === device.id ? "Conectando…" : device.name}
                </Text>
              </View>
              <Text style={ui.description}>{device.id}</Text>
            </TouchableOpacity>
          ))}
          {!devices.length && (
            <Text style={ui.description}>
              Procurando estações. Confira a alimentação, o Bluetooth e as
              permissões do celular.
            </Text>
          )}
          <TouchableOpacity
            disabled={!!connecting}
            onPress={() => setScanRevision((v) => v + 1)}
          >
            <Text style={ui.link}>Buscar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={ui.section}>
        <Text style={ui.label}>
          {isAdmin ? "Estações cadastradas · Rede" : "Minhas estações"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            void Linking.openURL(
              API_CONFIG.baseUrl.replace(/\/api\/?$/, ""),
            ).catch(() => setError("Não foi possível abrir o site."));
          }}
        >
          <Text style={ui.link}>Abrir gráficos e histórico no site</Text>
        </TouchableOpacity>
        {stations.map((station) => (
          <View key={station.id} style={ui.secondary}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <Radio color={colors.accent} size={20} />
              <Text style={[ui.label, { flex: 1 }]}>{station.name}</Text>
            </View>
            <Text style={ui.description}>{station.device_id}</Text>
            {isAdmin && (
              <>
                <TouchableOpacity
                  onPress={() =>
                    setEditingInterval(
                      editingInterval === station.id ? null : station.id,
                    )
                  }
                >
                  <Text style={ui.link}>
                    {editingInterval === station.id
                      ? "Ocultar intervalo"
                      : "Alterar intervalo pela rede"}
                  </Text>
                </TouchableOpacity>
                {editingInterval === station.id && (
                  <IntervalControl
                    deviceId={station.id}
                    config={configs.find((c) => c.device_id === station.id)}
                    onChange={() => {
                      void refresh().catch((e) => setError(e.message));
                    }}
                  />
                )}
              </>
            )}
          </View>
        ))}
        {!stations.length && (
          <Text style={ui.description}>
            Nenhuma estação disponível para esta conta.
          </Text>
        )}
      </View>
    </Screen>
  );
}
