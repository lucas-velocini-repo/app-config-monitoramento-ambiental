import { requireAdmin } from "../account-api";
import { PermissionsAndroid, Platform } from "react-native";

import {
  BleManager,
  Device,
  State,
  Subscription,
} from "react-native-ble-plx";

import { BLE_UUID } from "./bleUUID";

class BLEService {

  public manager: BleManager;

  private connectedDevice: Device | null = null;

  private scanning = false;

  private messageCallback:
    ((message: string) => void) | null = null;

  private connectionCallback:
    ((connected: boolean) => void) | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {

    if (Platform.OS !== "android") {
      return true;
    }

    if (Platform.Version < 31) {

      const granted =
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

      return (
        granted ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const result =
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

    return (
      result["android.permission.BLUETOOTH_SCAN"] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      result["android.permission.BLUETOOTH_CONNECT"] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  async saveIdentity(
      deviceId: string,
      apiToken: string
  ): Promise<void> {

      const message = {
          command: "save_identity",
          deviceId: deviceId,
          apiToken: apiToken,
      };

      await this.send(
          JSON.stringify(message)
      );
  }

  async saveServer(
    server: string
  ): Promise<void> {

    await this.send(
      JSON.stringify({
        command: "save_server",
        server: server,
      })
    );
  }

  async waitForBluetoothPoweredOn(): Promise<void> {

    const currentState =
      await this.manager.state();

    if (currentState === State.PoweredOn) {
      return;
    }

    return new Promise((resolve) => {

      let subscription: Subscription;

      subscription =
        this.manager.onStateChange(
          (state) => {

            if (state === State.PoweredOn) {
              subscription.remove();
              resolve();
            }

          },
          true
        );

    });
  }

  async startScan(
    onDeviceFound:
      (device: {
        id: string;
        name: string;
      }) => void
  ) {

    if (this.scanning) {
      return;
    }

    await this.waitForBluetoothPoweredOn();

    this.scanning = true;

    this.manager.startDeviceScan(
      [BLE_UUID.SERVICE],
      null,
      (error, device) => {

        if (error) {

          console.error(
            "Erro durante scan BLE:",
            error
          );

          this.scanning = false;
          return;
        }

        if (!device) {
          return;
        }

        const name =
          device.localName ??
          device.name ??
          "Estação meteorológica";

        console.log(
          "Estação BLE encontrada:",
          {
            id: device.id,
            name: device.name,
            localName: device.localName,
            serviceUUIDs:
              device.serviceUUIDs,
            rssi: device.rssi,
          }
        );

        onDeviceFound({
          id: device.id,
          name,
        });
      }
    );
  }

  stopScan() {

    this.manager.stopDeviceScan();
    this.scanning = false;
  }

  async connect(deviceId: string) {

    const device =
      await this.manager.connectToDevice(
        deviceId
      );

    await device
      .discoverAllServicesAndCharacteristics();

    await device.requestMTU(247);

    await device
      .monitorCharacteristicForService(
        BLE_UUID.SERVICE,
        BLE_UUID.TX,
        (error, characteristic) => {

          if (error) {

            if (error.errorCode === 201) {
              return;
            }

            console.error(error);
            return;
          }

          if (!characteristic?.value) {
            return;
          }

          const message =
            atob(characteristic.value);

          this.messageCallback?.(
            message
          );
        }
      );

    this.connectedDevice = device;

    device.onDisconnected(() => {

      this.connectedDevice = null;

      this.connectionCallback?.(
        false
      );
    });

    this.connectionCallback?.(true);

    return device;
  }

  async disconnect() {

    if (!this.connectedDevice) {
      this.connectionCallback?.(false);
      return;
    }

    const id =
      this.connectedDevice.id;

    try {

      await this.manager
        .cancelDeviceConnection(id);

    }
    finally {

      this.connectedDevice = null;

      this.connectionCallback?.(
        false
      );
    }
  }

  setConnectionCallback(
    callback:
      (connected: boolean) => void
  ) {

    this.connectionCallback =
      callback;

    callback(
      this.connectedDevice !== null
    );
  }

  setMessageCallback(
    callback:
      (message: string) => void
  ) {

    this.messageCallback =
      callback;
  }

  async send(message: string) {

    // Login protects the official app. Firmware-side BLE authorization is a separate change.
    await requireAdmin();

    if (!this.connectedDevice) {
      throw new Error("A estação não está conectada por Bluetooth.");
    }

    const encoded =
      btoa(message);

    await this.connectedDevice
      .writeCharacteristicWithResponseForService(
        BLE_UUID.SERVICE,
        BLE_UUID.RX,
        encoded
      );
  }

  async getStatus() {

    await this.send(
      JSON.stringify({
        command: "get_status"
      })
    );
  }

  async configureWifi(
    ssid: string,
    password: string,
    server: string
  ) {

    await this.send(
      JSON.stringify({
        command: "configure_wifi",
        ssid,
        password,
        server
      })
    );
  }
}

export default new BLEService();