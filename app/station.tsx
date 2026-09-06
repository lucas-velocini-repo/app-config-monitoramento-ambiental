import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import {
    ArrowLeft,
    Bluetooth,
    CheckCircle2,
} from "lucide-react-native";

import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    useEffect,
    useState,
} from "react";

import BLEService from "./services/ble";
import { BLEMessage } from "./services/ble-types";
import { registerDevice } from "./services/device-api";


export default function Station() {

    const router = useRouter();

    const { name } =
        useLocalSearchParams();

    const moduleName =
        typeof name === "string"
            ? name
            : "Estação meteorológica";

    const [stationName, setStationName] =
        useState("");

    const [hardwareId, setHardwareId] =
        useState("");

    const [bluetoothConnected, setBluetoothConnected] =
        useState(false);

    const [configuring, setConfiguring] =
        useState(false);

    const [configured, setConfigured] =
        useState(false);

    const [message, setMessage] =
        useState("");

    /*
     * Mantemos temporariamente o token recebido
     * enquanto aguardamos confirmação do ESP.
     */
    const [pendingToken, setPendingToken] =
        useState<string | null>(null);

    const [pendingDeviceId, setPendingDeviceId] =
        useState<string | null>(null);


    useEffect(() => {

        BLEService.setMessageCallback(
            (message) => {

                const data =
                    JSON.parse(message) as BLEMessage;

                switch (data.type) {

                    case "status":

                        setBluetoothConnected(
                            data.bluetooth
                        );

                        setHardwareId(
                            data.hardwareId
                        );

                        /*
                        * Se o ESP já possui Device ID e token,
                        * ele já foi configurado anteriormente.
                        */
                        if (
                            data.deviceId &&
                            data.apiTokenConfigured
                            ) {
                            router.replace({
                                pathname: "/wifi",
                                params: {
                                name: moduleName,
                                },
                            });

                            return;
                            }

                        break;


                    case "identity_saved":

                        if (
                            data.status === "ok"
                        ) {
                            setConfiguring(false);
                            setConfigured(true);

                            setPendingToken(null);
                            setPendingDeviceId(null);

                            setMessage(
                                "Estação configurada com sucesso."
                            );
                        }
                        else {
                            setConfiguring(false);

                            setMessage(
                                data.message ??
                                "Não foi possível configurar a estação."
                            );
                        }

                        break;
                }
            }
        );


        BLEService.setConnectionCallback(
            (connected) => {
                setBluetoothConnected(
                    connected
                );
            }
        );


        BLEService.getStatus();

        /*
         * IMPORTANTE:
         * não desconectamos o BLE aqui.
         *
         * Precisamos manter a conexão quando
         * navegarmos para a tela de Wi-Fi.
         */
        return () => {
            BLEService.setMessageCallback(
                () => {}
            );
        };

    }, []);


    async function configureStation() {

        if (!bluetoothConnected) {
            setMessage(
                "A estação não está conectada por Bluetooth."
            );
            return;
        }

        if (!hardwareId) {
            setMessage(
                "Não foi possível identificar a estação."
            );
            return;
        }

        if (!stationName.trim()) {
            setMessage(
                "Informe um nome para a estação."
            );
            return;
        }

        setConfiguring(true);
        setMessage("");

        try {

            let deviceId =
                pendingDeviceId;

            let apiToken =
                pendingToken;

            /*
             * Só chama o backend se ainda não
             * possuímos as credenciais em memória.
             */
            if (!deviceId || !apiToken) {

                const registered =
                    await registerDevice(
                        hardwareId,
                        stationName.trim()
                    );

                if (!registered.api_token) {
                    throw new Error(
                        "Servidor não forneceu a credencial da estação."
                    );
                }

                deviceId =
                    registered.device_id;

                apiToken =
                    registered.api_token;

                setPendingDeviceId(
                    deviceId
                );

                setPendingToken(
                    apiToken
                );
            }

            await BLEService.saveIdentity(
                deviceId,
                apiToken
            );

        }
        catch (error) {

            console.error(
                "Erro ao configurar estação:",
                error
            );

            setConfiguring(false);

            setMessage(
                "Não foi possível configurar a estação."
            );
        }
    }


    function continueToWifi() {

        router.push({
            pathname: "/wifi",
            params: {
                name:
                    stationName.trim()
                    || moduleName,
            },
        });
    }

    async function handleBack() {
        try {
            await BLEService.disconnect();
        }
        catch (error) {
            console.error(
            "Erro ao desconectar Bluetooth:",
            error
            );
        }
        finally {
            router.back();
        }
    }


    return (
        <View style={styles.container}>

            <Image
                source={require(
                    "../assets/images/logo-2-transp.png"
                )}
                style={styles.logo}
                resizeMode="contain"
            />

            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                >
                    <ArrowLeft
                        color="#0056b3"
                        size={20}
                    />
                </TouchableOpacity>

                <Text style={styles.pageTitle}>
                    Configurar estação
                </Text>

            </View>


            <View style={styles.statusCard}>

                <View>
                    <Text style={styles.statusLabel}>
                        Estação
                    </Text>

                    <Text style={styles.statusValue}>
                        {stationName.trim()
                            || moduleName}
                    </Text>
                </View>


                <View style={styles.statusBadge}>

                    {bluetoothConnected ? (
                        <CheckCircle2
                            color="#22c55e"
                            size={20}
                        />
                    ) : (
                        <Bluetooth
                            color="#ef4444"
                            size={20}
                        />
                    )}

                    <Text style={styles.statusText}>
                        {bluetoothConnected
                            ? "Bluetooth conectado"
                            : "Bluetooth desconectado"}
                    </Text>

                </View>

            </View>


            {!configured ? (
                <View style={styles.form}>

                    <Text style={styles.label}>
                        Nome da estação
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={stationName}
                        onChangeText={setStationName}
                        placeholder="Ex.: Estação Sala"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                    />

                    <TouchableOpacity
                        style={[
                            styles.button,
                            configuring
                                && styles.buttonDisabled,
                        ]}
                        disabled={configuring}
                        onPress={configureStation}
                    >

                        <Text style={styles.buttonText}>
                            {configuring
                                ? "Configurando..."
                                : "Configurar estação"}
                        </Text>

                    </TouchableOpacity>

                </View>
            ) : (
                <View style={styles.successCard}>

                    <CheckCircle2
                        color="#22c55e"
                        size={34}
                    />

                    <Text style={styles.successTitle}>
                        Estação configurada
                    </Text>

                    <Text style={styles.successText}>
                        Agora configure a rede Wi-Fi
                        utilizada pela estação.
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={continueToWifi}
                    >
                        <Text style={styles.buttonText}>
                            Continuar
                        </Text>
                    </TouchableOpacity>

                </View>
            )}


            {message.length > 0 && (
                <Text style={styles.message}>
                    {message}
                </Text>
            )}

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

    pageTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#0f172a",
        marginTop: 5,
    },

    statusCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        gap: 14,
    },

    statusLabel: {
        fontSize: 12,
        color: "#64748b",
    },

    statusValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0f172a",
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
    },

    statusText: {
        marginLeft: 7,
        color: "#334155",
    },

    form: {
        gap: 10,
    },

    label: {
        fontWeight: "600",
        color: "#1e293b",
    },

    input: {
        backgroundColor: "#ffffff",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },

    button: {
        backgroundColor: "#0056b3",
        padding: 15,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonText: {
        color: "#ffffff",
        fontWeight: "bold",
    },

    successCard: {
        backgroundColor: "#ffffff",
        padding: 22,
        borderRadius: 12,
        alignItems: "center",
        gap: 10,
    },

    successTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0f172a",
    },

    successText: {
        color: "#64748b",
        textAlign: "center",
    },

    message: {
        marginTop: 18,
        textAlign: "center",
        color: "#475569",
    },
});