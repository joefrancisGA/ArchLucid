import { API_KEYS_ADMIN_KEY_NAME, API_KEYS_READONLY_KEY_NAME } from "@/lib/api-keys-settings-copy";
import type { ApiKeyAuditEvent, ApiKeyCredentialSlot } from "@/lib/api-keys-settings-types";

export const API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY =
  "archlucid_api_key_credential_continue_last_v1";

export type ApiKeysContinueLastCredentialInput = {
  readonly slot: ApiKeyCredentialSlot;
  readonly keyName: string;
  readonly isConfigured: boolean;
  readonly expiresAtUtc: string | null | undefined;
};

export type ApiKeysContinueLastTarget = {
  readonly slot: ApiKeyCredentialSlot;
  readonly keyName: string;
};

function readStoredSlot(): ApiKeyCredentialSlot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    if (stored === "Admin" || stored === "ReadOnly") {
      return stored;
    }

    return null;
  } catch {
    return null;
  }
}

export function writeApiKeyCredentialLastViewedSlot(slot: ApiKeyCredentialSlot): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY, slot);
  } catch {
    /* ignore */
  }
}

function isSlotActive(credential: ApiKeysContinueLastCredentialInput): boolean {
  if (credential.isConfigured !== true) {
    return false;
  }

  const expiresAtUtc = credential.expiresAtUtc;

  if (expiresAtUtc === null || expiresAtUtc === undefined || expiresAtUtc.trim().length === 0) {
    return true;
  }

  const expiresMs = Date.parse(expiresAtUtc);

  if (!Number.isNaN(expiresMs) && expiresMs < Date.now()) {
    return false;
  }

  return true;
}

function slotFromKeyName(keyName: string): ApiKeyCredentialSlot | null {
  if (keyName === API_KEYS_ADMIN_KEY_NAME) {
    return "Admin";
  }

  if (keyName === API_KEYS_READONLY_KEY_NAME) {
    return "ReadOnly";
  }

  return null;
}

function toTarget(credential: ApiKeysContinueLastCredentialInput): ApiKeysContinueLastTarget {
  return {
    slot: credential.slot,
    keyName: credential.keyName.trim().length > 0 ? credential.keyName : `${credential.slot} key`,
  };
}

/** Resolves the API key credential slot to pin as Continue last viewed. Never includes secret material. */
export function resolveContinueLastApiKeyCredential(
  credentials: readonly ApiKeysContinueLastCredentialInput[],
  auditEvents: readonly ApiKeyAuditEvent[] = [],
): ApiKeysContinueLastTarget | null {
  if (credentials.length === 0) {
    return null;
  }

  const storedSlot = readStoredSlot();

  if (storedSlot !== null) {
    const storedMatch = credentials.find((credential) => credential.slot === storedSlot);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const activeMatch = credentials.find((credential) => isSlotActive(credential));

  if (activeMatch !== undefined) {
    return toTarget(activeMatch);
  }

  const newestAudit = auditEvents
    .slice()
    .sort((left, right) => right.occurredAtUtc.localeCompare(left.occurredAtUtc))[0];

  if (newestAudit !== undefined) {
    const auditSlot = slotFromKeyName(newestAudit.keyName);
    const auditMatch =
      auditSlot === null ? undefined : credentials.find((credential) => credential.slot === auditSlot);

    if (auditMatch !== undefined) {
      return toTarget(auditMatch);
    }
  }

  const first = credentials[0];

  return first === undefined ? null : toTarget(first);
}
