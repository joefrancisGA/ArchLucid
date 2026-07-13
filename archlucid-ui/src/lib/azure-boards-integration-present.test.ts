import { describe, expect, it } from "vitest";

import {
  isAzureBoardsCredentialsReady,
  resolveAzureBoardsConnectionStatus,
  resolveAzureBoardsConnectionTestGate,
  sanitizeCustomerFacingProbeSummary,
} from "./azure-boards-integration-present";

describe("azure-boards-integration-present", () => {
  it("sanitizes raw API terminology from probe summaries", () => {
    expect(sanitizeCustomerFacingProbeSummary("401 from _apis/wit/workitemtypes")).toContain("token permissions");
  });

  it("reports setup incomplete when credentials are missing", () => {
    const status = resolveAzureBoardsConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: false,
      settingsReady: false,
      health: { reachable: false, summary: "not configured" },
    });

    expect(status.label).toBe("Setup incomplete");
  });

  it("reports connected when health probe succeeds", () => {
    const status = resolveAzureBoardsConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: true,
      settingsReady: true,
      health: { reachable: true, summary: "ok" },
    });

    expect(status.label).toBe("Connected");
  });

  it("blocks connection test until project defaults exist", () => {
    const gate = resolveAzureBoardsConnectionTestGate({
      nativeEnabled: true,
      credentialsReady: true,
      settingsReady: false,
      isTesting: false,
      isSaving: false,
    });

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toMatch(/project/i);
  });

  it("treats configured tenant connection as credentials ready", () => {
    expect(
      isAzureBoardsCredentialsReady(
        { isConfigured: true, credentialKeyVaultSecretName: "kv-pat-ref" },
        null,
      ),
    ).toBe(true);
  });
});
