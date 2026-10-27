import { accountRequest } from "../account-api";
export interface StationConfiguration {
  device_id: number;
  desired_interval_seconds: number | null;
  reported_interval_seconds: number | null;
  revision: number;
  applied_revision: number;
  pending: boolean;
  reported_at: string | null;
}
export function listConfigurations() {
  return accountRequest<StationConfiguration[]>("/admin/device-configurations");
}
export function requestInterval(deviceId: number, seconds: number) {
  if (!Number.isInteger(seconds) || seconds < 30 || seconds > 86400)
    throw new Error("Informe um intervalo inteiro entre 30 e 86400 segundos.");
  return accountRequest<StationConfiguration>(
    `/admin/devices/${deviceId}/configuration`,
    "PATCH",
    { interval_seconds: seconds },
  );
}
