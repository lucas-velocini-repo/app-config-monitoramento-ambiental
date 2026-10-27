import { API_CONFIG } from "./config/api";

export interface AccountUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  status: string;
  mfa_enabled: boolean;
}
export interface AccountSession {
  user: AccountUser;
  token?: string;
  expires_at: string;
  mfa_setup_required: boolean;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let token: string | null = null;
let onExpired: (() => void) | null = null;
export function setAccountToken(value: string | null) {
  token = value;
}
export function onSessionExpired(callback: (() => void) | null) {
  onExpired = callback;
}

export async function accountRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const base = API_CONFIG.baseUrl.replace(/\/$/, "");
  if (!base || (!__DEV__ && !base.startsWith("https://")))
    throw new Error(
      "Configure um endereço HTTPS válido para o servidor do CASA.",
    );
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") onExpired?.();
    throw new ApiError(
      typeof data?.detail === "string"
        ? data.detail
        : "Não foi possível concluir a solicitação.",
      response.status,
    );
  }
  return data as T;
}

export async function requireAdmin() {
  const session = await accountRequest<AccountSession>("/auth/me");
  if (session.user.role !== "admin" || session.mfa_setup_required)
    throw new Error(
      "Esta configuração exige uma conta administrativa com segundo fator ativo.",
    );
  return session;
}
