import { API_CONFIG } from "../config/api";

export interface RegisterDeviceResponse {
    device_id: string;
    hardware_id: string;
    name: string;
    api_token: string | null;
}


export async function registerDevice(
    hardwareId: string,
    name: string
): Promise<RegisterDeviceResponse> {

    const response = await fetch(
        `${API_CONFIG.baseUrl}/devices/register`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                hardware_id: hardwareId,
                name: name,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `Erro ao registrar estação: ${response.status}`
        );
    }

    return await response.json();
}