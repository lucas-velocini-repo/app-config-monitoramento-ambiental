const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export const API_CONFIG = {
    baseUrl: API_BASE_URL,

    measurementsUrl:
        API_BASE_URL
            ? `${API_BASE_URL}/measurements`
            : "",
};