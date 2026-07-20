export interface StatusMessage {

    type: "status";

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

export type BLEMessage =
    | StatusMessage
    | ConfigureResultMessage;