const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://t2phealth.com.br/api";

export const API_CONFIG = {
    baseUrl: API_BASE_URL,

    measurementsUrl:
        API_BASE_URL
            ? `${API_BASE_URL}/measurements`
            : "",
};