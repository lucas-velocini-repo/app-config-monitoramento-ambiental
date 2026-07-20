import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { BLE_UUID } from "./bleUUID";

class BLEService {
    public manager: BleManager;

    private connectedDevice: Device | null = null;
    private scanning = false;
    private messageCallback: ((message: string)=>void) | null = null;
    private connectionCallback: ((connected: boolean) => void) | null = null;

    
    constructor() {
        this.manager = new BleManager();
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS !== "android") {
        return true;
        }

        if (Platform.Version < 31) {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        const result = await PermissionsAndroid.requestMultiple([
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

    startScan(
        onDeviceFound: (device: { id: string; name: string }) => void
    )
    {
        if(this.scanning)
        {
            return;
        }

        this.scanning = true;

        this.manager.startDeviceScan(
            null,
            null,
            (error, device) => {

                if(error)
                {
                    console.error(error);
                    this.scanning = false;
                    return;
                }

                if(!device?.name)
                {
                    return;
                }

                onDeviceFound({
                    id: device.id,
                    name: device.name,
                });
            }
        );
    }

    stopScan()
    {
        this.manager.stopDeviceScan();
        this.scanning = false;
    }

    async connect(deviceId: string) {
        const device =
            await this.manager.connectToDevice(deviceId);

        await device.discoverAllServicesAndCharacteristics();
        await device.requestMTU(247);

        await device.monitorCharacteristicForService(
            BLE_UUID.SERVICE,
            BLE_UUID.TX,
            (error, characteristic) => {
                if(error){
                    if(error.errorCode === 201){
                        return;
                    }

                    console.error(error);
                    return;
                }

                if(!characteristic?.value){
                    return;
                }

                const message =
                    atob(characteristic.value);

                this.messageCallback?.(message);
            }
        );

        this.connectedDevice = device;
        
        device.onDisconnected(() => {
            this.connectedDevice = null;
            this.connectionCallback?.(false);
        });

        this.connectionCallback?.(true);

        return device;
    }

    async disconnect() {
        if(this.connectedDevice) {
            const id = this.connectedDevice.id;
            this.connectedDevice = null;
            this.connectionCallback?.(false);
            await this.manager.cancelDeviceConnection(id);
        }
    }

    setConnectionCallback(
        callback: (connected:boolean)=>void
    )
    {
        this.connectionCallback = callback;
        callback(this.connectedDevice !== null);
        
    }

    setMessageCallback(
        callback:(message:string)=>void
    )
    {
        this.messageCallback = callback;
    }

    async send(message: string)
    {
        console.log("Sending message:", message);
        if(!this.connectedDevice){
            return;
        }

        const encoded = btoa(message);

        await this.connectedDevice.writeCharacteristicWithResponseForService(
            BLE_UUID.SERVICE,
            BLE_UUID.RX,
            encoded
        );
    }

    async getStatus(){
        await this.send(
            JSON.stringify({
                command:"get_status"
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