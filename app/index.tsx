import { useFocusEffect, useRouter } from "expo-router";
import { AlertCircle, Bluetooth } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BLEService from "./services/ble";

export default function Home() {
  const router = useRouter();
  const [devices, setDevices] = useState<
    { id: string; name: string }[]
    >([]);

  useFocusEffect(
    useCallback(() => {
        async function initializeBLE() {
            const ok =
                await BLEService.requestPermissions();

            if(!ok){
                return;
            }
            BLEService.startScan((device)=>{

                setDevices((old)=>{
                    const exists =
                        old.find(
                            d => d.id === device.id
                        );
                    if(exists){
                        return old;
                    }
                    return [
                        ...old,
                        device
                    ];
                });
            });
        }
        setDevices([]);
        initializeBLE();

        return () => {
            BLEService.stopScan();
        };
    }, [])
  );

  async function handleSelectDevice(
    device: {id:string; name:string}
  )
  {
    try {

      BLEService.stopScan();
      await BLEService.connect(device.id);

      router.push({
        pathname:"/config",
        params:{
          id:device.id,
          name:device.name
        }
      });

    } catch(error){

      console.log(
        "Erro ao conectar:",
        error
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
      <Text style={styles.title}>Olá!</Text>
      <Text style={styles.subtitle}>Conecte-se a um módulo disponível:</Text>

      {devices.length > 0 ? (
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
