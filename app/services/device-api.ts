export interface RegisterDeviceResponse {
    device_id: string;
    hardware_id: string;
    name: string;
}


export async function registerDevice(
    serverUrl: string,
    hardwareId: string,
    name: string
): Promise<RegisterDeviceResponse> {

    const apiBaseUrl =
        serverUrl.replace(
            /\/measurements\/?$/,
            ""
        );

    const response = await fetch(
        `${apiBaseUrl}/devices/register`,
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

    if(!response.ok)
    {
        throw new Error(
            `Erro ao registrar estação: ${response.status}`
        );
    }

    return await response.json();
}