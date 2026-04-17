const LAST_REGISTRATION_KEY = "archlucid_last_registration";

/** Payload persisted after `POST /v1/register` (camelCase from API JSON). */
export type LastRegistrationPayload = {
  tenantId?: string;
  defaultWorkspaceId?: string;
  defaultProjectId?: string;
  wasAlreadyProvisioned?: boolean;
  adminEmail?: string;
  organizationName?: string;
};

export function readLastRegistrationPayload(): LastRegistrationPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(LAST_REGISTRATION_KEY);

    if (raw === null || raw.length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object") {
      return null;
    }

    return parsed as LastRegistrationPayload;
  } catch {
    return null;
  }
}

export function clearLastRegistrationPayload(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(LAST_REGISTRATION_KEY);
  } catch {
    /* private mode */
  }
}

/** Scope headers derived from the last self-service registration (browser session). */
export function registrationScopeHeaders(): Record<string, string> | null {
  const payload = readLastRegistrationPayload();

  if (payload === null) {
    return null;
  }

  const tenantId = payload.tenantId?.trim() ?? "";
  const workspaceId = payload.defaultWorkspaceId?.trim() ?? "";
  const projectId = payload.defaultProjectId?.trim() ?? "";

  if (tenantId.length === 0 || workspaceId.length === 0 || projectId.length === 0) {
    return null;
  }

  return {
    "x-tenant-id": tenantId,
    "x-workspace-id": workspaceId,
    "x-project-id": projectId,
  };
}
