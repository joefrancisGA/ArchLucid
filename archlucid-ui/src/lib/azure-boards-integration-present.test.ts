import { describe, expect, it } from "vitest";

import {
  AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION,
  isAzureBoardsCredentialsReady,
  resolveAzureBoardsConnectionStatus,
  resolveAzureBoardsConnectionTestGate,
  sanitizeAzureBoardsLoadErrorForConnectionStatus,
  sanitizeCustomerFacingProbeSummary,
} from "./azure-boards-integration-present";

describe("azure-boards-integration-present", () => {
  it("sanitizes raw API terminology from probe summaries", () => {
    expect(sanitizeCustomerFacingProbeSummary("401 from _apis/wit/workitemtypes")).toContain("token permissions");
  });

  it("never puts Database Query Failed into connection status explanation (TB-1153)", () => {
    const raw =
      "Database Query Failed: The database rejected the query due to a programming error";

    expect(sanitizeAzureBoardsLoadErrorForConnectionStatus(raw)).toBe(
      AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION,
    );

    const status = resolveAzureBoardsConnectionStatus({
      isLoading: false,
      loadError: raw,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: false,
      settingsReady: false,
      health: null,
    });

    expect(status.explanation).toBe(AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION);
    expect(status.explanation).not.toMatch(/Database Query Failed/i);
    expect(status.explanation).not.toMatch(/programming error/i);
  });

  it("keeps already buyer-safe load errors as connection status explanation", () => {
    const safe = "Some Azure Boards data could not be loaded (Azure Boards settings).";

    expect(sanitizeAzureBoardsLoadErrorForConnectionStatus(safe)).toBe(safe);
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
