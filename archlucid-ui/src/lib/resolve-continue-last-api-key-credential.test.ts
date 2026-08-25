import { describe, expect, it } from "vitest";

import { API_KEYS_ADMIN_KEY_NAME, API_KEYS_READONLY_KEY_NAME } from "@/lib/api-keys-settings-copy";
import type { ApiKeyAuditEvent } from "@/lib/api-keys-settings-types";
import {
  API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY,
  resolveContinueLastApiKeyCredential,
  type ApiKeysContinueLastCredentialInput,
} from "@/lib/resolve-continue-last-api-key-credential";

function credential(
  overrides: Partial<ApiKeysContinueLastCredentialInput> & Pick<ApiKeysContinueLastCredentialInput, "slot">,
): ApiKeysContinueLastCredentialInput {
  return {
    keyName: overrides.slot === "Admin" ? API_KEYS_ADMIN_KEY_NAME : API_KEYS_READONLY_KEY_NAME,
    isConfigured: true,
    expiresAtUtc: null,
    ...overrides,
  };
}

function auditEvent(overrides: Partial<ApiKeyAuditEvent> = {}): ApiKeyAuditEvent {
  return {
    id: "evt-1",
    occurredAtUtc: "2026-08-01T00:00:00.000Z",
    actor: "self",
    action: "key_rotated",
    keyName: API_KEYS_READONLY_KEY_NAME,
    outcome: "success",
    ...overrides,
  };
}

describe("resolveContinueLastApiKeyCredential", () => {
  it("returns the stored slot when it still exists", () => {
    window.localStorage.setItem(API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY, "ReadOnly");

    const match = resolveContinueLastApiKeyCredential([
      credential({ slot: "Admin" }),
      credential({ slot: "ReadOnly" }),
    ]);

    expect(match?.slot).toBe("ReadOnly");
    expect(match?.keyName).toBe(API_KEYS_READONLY_KEY_NAME);
  });

  it("falls back to the first active slot when no stored id exists", () => {
    window.localStorage.removeItem(API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY);

    const match = resolveContinueLastApiKeyCredential([
      credential({ slot: "Admin", isConfigured: false }),
      credential({ slot: "ReadOnly", isConfigured: true }),
    ]);

    expect(match?.slot).toBe("ReadOnly");
  });

  it("falls back to the newest audit event slot when no slot is active", () => {
    window.localStorage.removeItem(API_KEY_CREDENTIAL_LAST_VIEWED_STORAGE_KEY);

    const match = resolveContinueLastApiKeyCredential(
      [
        credential({ slot: "Admin", isConfigured: false }),
        credential({ slot: "ReadOnly", isConfigured: false }),
      ],
      [
        auditEvent({
          id: "old",
          occurredAtUtc: "2026-01-01T00:00:00.000Z",
          keyName: API_KEYS_ADMIN_KEY_NAME,
        }),
        auditEvent({
          id: "new",
          occurredAtUtc: "2026-08-20T00:00:00.000Z",
          keyName: API_KEYS_READONLY_KEY_NAME,
        }),
      ],
    );

    expect(match?.slot).toBe("ReadOnly");
  });
});
