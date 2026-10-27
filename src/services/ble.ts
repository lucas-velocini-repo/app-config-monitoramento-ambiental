import { requireAdmin } from "../account-api";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleManager,
  BleErrorCode,
  Device,
  State,
  Subscription,
} from "react-native-ble-plx";
import { BLE_UUID } from "./bleUUID";

export type DiscoveredStation = { id: string; name: string };
export function stationDisplayName(device: {
  id: string;
  localName?: string | null;
  name?: string | null;
}) {
  return (
    device.localName?.trim() ||
    device.name?.trim() ||
    `CASA · ${device.id
      .replace(/[^a-z0-9]/gi, "")
      .slice(-6)
      .toUpperCase()}`
  );
}

class BLEService {
  public manager = new BleManager();
  private connectedDevice: Device | null = null;
  private connectingId: string | null = null;
  private scanning = false;
  private stoppingScan: Promise<void> = Promise.resolve();
  private scanGeneration = 0;
  private connectionGeneration = 0;
  private monitor: Subscription | null = null;
  private disconnected: Subscription | null = null;
  private messageCallback: ((message: string) => void) | null = null;
  private connectionCallback: ((connected: boolean) => void) | null = null;

  async requestPermissions() {
    if (Platform.OS !== "android") return true;
    if (Platform.Version < 31)
      return (
        (await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        )) === PermissionsAndroid.RESULTS.GRANTED
      );
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(result).every(
      (value) => value === PermissionsAndroid.RESULTS.GRANTED,
    );
  }
  async waitForBluetoothPoweredOn(): Promise<void> {
    if ((await this.manager.state()) === State.PoweredOn) return;
    return new Promise((resolve, reject) => {
      let subscription: Subscription | undefined;
      const timer = setTimeout(() => {
        subscription?.remove();
        reject(new Error("Ative o Bluetooth e tente novamente."));
      }, 15000);
      subscription = this.manager.onStateChange((state) => {
        if (state === State.PoweredOn) {
          clearTimeout(timer);
          subscription?.remove();
          resolve();
        }
      }, true);
    });
  }
  async startScan(
    onDeviceFound: (device: DiscoveredStation) => void,
    onError?: (error: Error) => void,
  ) {
    if (this.scanning) return;
    const generation = ++this.scanGeneration;
    await this.stoppingScan;
    await this.waitForBluetoothPoweredOn();
    if (generation !== this.scanGeneration) return;
    this.scanning = true;
    const names = new Map<string, { name: string; quality: number }>();
    try {
      await this.manager.startDeviceScan(
        [BLE_UUID.SERVICE],
        { allowDuplicates: true },
        (error, device) => {
          if (generation !== this.scanGeneration) return;
          if (error) {
            this.stopScan();
            onError?.(
              new Error(
                "Não foi possível buscar estações. Confira o Bluetooth e as permissões.",
              ),
            );
            return;
          }
          if (device) {
            const quality = device.localName?.trim()
              ? 2
              : device.name?.trim()
                ? 1
                : 0;
            const previous = names.get(device.id);
            const current =
              previous && previous.quality > quality
                ? previous
                : { name: stationDisplayName(device), quality };
            names.set(device.id, current);
            onDeviceFound({ id: device.id, name: current.name });
          }
        },
      );
    } catch (error) {
      this.scanning = false;
      throw error;
    }
  }
  stopScan() {
    ++this.scanGeneration; // Also cancels a scan waiting for Bluetooth to turn on.
    this.stoppingScan = Promise.resolve(this.manager.stopDeviceScan()).catch(
      () => {},
    );
    this.scanning = false;
    return this.stoppingScan;
  }
  async connect(deviceId: string) {
    await this.disconnect();
    await this.stopScan();
    const generation = ++this.connectionGeneration;
    this.connectingId = deviceId;
    try {
      const device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      });
      if (generation !== this.connectionGeneration)
        throw new Error("Conexão cancelada.");
      this.connectedDevice = device;
      await device.discoverAllServicesAndCharacteristics();
      if (Platform.OS === "android") await device.requestMTU(247);
      if (generation !== this.connectionGeneration)
        throw new Error("Conexão cancelada.");
      this.monitor = device.monitorCharacteristicForService(
        BLE_UUID.SERVICE,
        BLE_UUID.TX,
        (error, characteristic) => {
          if (!error && characteristic?.value)
            this.messageCallback?.(atob(characteristic.value));
        },
      );
      this.disconnected = device.onDisconnected(() => {
        if (
          this.connectedDevice?.id !== deviceId ||
          generation !== this.connectionGeneration
        )
          return;
        this.clearConnection();
      });
      this.connectingId = null;
      this.connectionCallback?.(true);
      return device;
    } catch (error) {
      // A cancellation during discovery must release the native BLE connection too.
      if (generation === this.connectionGeneration)
        await this.disconnect().catch(() => {});
      else await this.manager.cancelDeviceConnection(deviceId).catch(() => {});
      throw error;
    }
  }
  private clearConnection() {
    this.monitor?.remove();
    this.monitor = null;
    this.disconnected?.remove();
    this.disconnected = null;
    this.connectedDevice = null;
    this.connectingId = null;
    this.connectionCallback?.(false);
  }
  async disconnect() {
    ++this.connectionGeneration;
    const id = this.connectedDevice?.id ?? this.connectingId;
    this.clearConnection();
    if (id) {
      try {
        await this.manager.cancelDeviceConnection(id);
      } catch (error) {
        if (
          (error as { errorCode?: number }).errorCode !==
          BleErrorCode.DeviceNotConnected
        )
          throw error;
      }
    }
  }
  setConnectionCallback(callback: ((connected: boolean) => void) | null) {
    this.connectionCallback = callback;
    callback?.(this.connectedDevice !== null);
  }
  setMessageCallback(callback: ((message: string) => void) | null) {
    this.messageCallback = callback;
  }
  get connectionKey() {
    return this.connectedDevice
      ? `${this.connectedDevice.id}:${this.connectionGeneration}`
      : null;
  }
  async send(message: string) {
    const device = this.connectedDevice;
    await requireAdmin();
    if (!device || device !== this.connectedDevice)
      throw new Error("A estação não está conectada por Bluetooth.");
    await device.writeCharacteristicWithResponseForService(
      BLE_UUID.SERVICE,
      BLE_UUID.RX,
      btoa(message),
    );
  }
  async getStatus() {
    await this.send(JSON.stringify({ command: "get_status" }));
  }
  async saveIdentity(deviceId: string, apiToken: string) {
    await this.send(
      JSON.stringify({ command: "save_identity", deviceId, apiToken }),
    );
  }
  async saveServer(server: string) {
    await this.send(JSON.stringify({ command: "save_server", server }));
  }
  async configureWifi(ssid: string, password: string, server: string) {
    await this.send(
      JSON.stringify({ command: "configure_wifi", ssid, password, server }),
    );
  }
}
export default new BLEService();
