export interface StatusMessage {

    type: "status";

    hardwareId: string;

    deviceId: string;

    bluetooth: boolean;

    wifiConnected: boolean;

    ssid: string;

    ip: string;

}


export interface ConfigureResultMessage {

    type: "configure_result";

    status: "ok" | "error";

    message?: string;

}


export interface IdentitySavedMessage {

    type: "identity_saved";

    status: "ok" | "error";

    deviceId?: string;

    message?: string;

}


export type BLEMessage =
    | StatusMessage
    | ConfigureResultMessage
    | IdentitySavedMessage;