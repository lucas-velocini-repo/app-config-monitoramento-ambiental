import { accountRequest, requireAdmin } from "../account-api";

export interface RegisterDeviceResponse {
  device_id: string;
  hardware_id: string;
  name: string;
  api_token: string | null;
}
export async function registerDevice(
  hardwareId: string,
  name: string,
): Promise<RegisterDeviceResponse> {
  await requireAdmin();
  return accountRequest<RegisterDeviceResponse>("/devices/register", "POST", {
    hardware_id: hardwareId,
    name,
  });
}
export async function confirmProvisioning(deviceId: string) {
  return accountRequest(
    `/devices/${encodeURIComponent(deviceId)}/provisioning/confirm`,
    "POST",
  );
}
