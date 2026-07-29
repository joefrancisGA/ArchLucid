import { describe, expect, it } from "vitest";

import {
  isServiceNowCredentialsReady,
  resolveServiceNowConnectionStatus,
  resolveServiceNowConnectionTestGate,
  sanitizeCustomerFacingProbeSummary,
  sanitizeServiceNowLoadErrorForConnectionStatus,
  SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION,
} from "./servicenow-integration-present";

describe("servicenow-integration-present", () => {
  it("never puts Database Query Failed into connection status explanation (TB-1163)", () => {
    const raw =
      "Database Query Failed: The database rejected the query due to a programming error";

    expect(sanitizeServiceNowLoadErrorForConnectionStatus(raw)).toBe(
      SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION,
    );

    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: raw,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: false,
      probe: null,
    });

    expect(status.explanation).toBe(SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION);
    expect(status.explanation).not.toMatch(/Database Query Failed/i);
    expect(status.explanation).not.toMatch(/programming error/i);
  });

  it("keeps already buyer-safe load errors as connection status explanation", () => {
    const safe = "Some ServiceNow data could not be loaded (ServiceNow settings).";

    expect(sanitizeServiceNowLoadErrorForConnectionStatus(safe)).toBe(safe);
  });

  it("reports setup incomplete when credentials are missing", () => {
    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: false,
      probe: { locallyConfigured: false, summary: "missing" },
    });

    expect(status.status).toBe("setup-incomplete");
    expect(status.label).toBe("Setup incomplete");
  });

  it("reports connected when probe is reachable", () => {
    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: true,
      probe: { locallyConfigured: true, reachable: true, summary: "ok" },
    });

    expect(status.status).toBe("connected");
  });

  it("reports connection issue when probe is unreachable", () => {
    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: true,
      probe: { locallyConfigured: true, reachable: false, summary: "401 unauthorized" },
    });

    expect(status.status).toBe("connection-issue");
    expect(status.explanation).toContain("401");
  });

  it("disables connection test before credentials are ready", () => {
    const gate = resolveServiceNowConnectionTestGate({
      nativeEnabled: true,
      credentialsReady: false,
      isTesting: false,
      isSaving: false,
    });

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toMatch(/credential setup/i);
  });

  it("treats deployment credentials as ready", () => {
    expect(
      isServiceNowCredentialsReady(
        { deploymentCredentials: { serviceNowConfigured: true } },
        null,
        null,
      ),
    ).toBe(true);
  });

  it("sanitizes internal probe summaries", () => {
    expect(
      sanitizeCustomerFacingProbeSummary(
        "not configured — add Integrations:ItsmOutbound:ServiceNow credentials in host configuration",
      ),
    ).not.toMatch(/Integrations:ItsmOutbound|host configuration/i);
  });
});
