import { describe, expect, it } from "vitest";

import {
  isServiceNowCredentialsReady,
  resolveServiceNowConnectionStatus,
  resolveServiceNowConnectionTestGate,
  sanitizeCustomerFacingProbeSummary,
} from "./servicenow-integration-present";

describe("servicenow-integration-present", () => {
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
