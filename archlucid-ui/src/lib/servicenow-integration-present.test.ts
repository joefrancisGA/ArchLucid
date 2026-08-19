import { describe, expect, it } from "vitest";

import {
  isServiceNowCredentialsReady,
  resolveServiceNowConnectionStatus,
  resolveServiceNowConnectionTestGate,
  resolveServiceNowPageComposition,
  sanitizeCustomerFacingProbeSummary,
  sanitizeServiceNowLoadErrorForConnectionStatus,
  SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION,
} from "./servicenow-integration-present";
import {
  SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_ADMIN,
  SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_OPERATOR,
} from "./servicenow-integration-page-copy";

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
      canConfigureAdmin: false,
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
      canConfigureAdmin: false,
      probe: { locallyConfigured: false, summary: "missing" },
    });

    expect(status.status).toBe("setup-incomplete");
    expect(status.label).toBe("Setup incomplete");
  });

  it("uses admin next action when credentials are missing and caller can configure", () => {
    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: false,
      canConfigureAdmin: true,
      probe: { locallyConfigured: false, summary: "missing" },
    });

    expect(status.nextAction).toBe(SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_ADMIN);
  });

  it("uses operator next action when credentials are missing and caller cannot configure", () => {
    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: false,
      canConfigureAdmin: false,
      probe: { locallyConfigured: false, summary: "missing" },
    });

    expect(status.nextAction).toBe(SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_OPERATOR);
  });

  it("reports connected when probe is reachable", () => {
    const status = resolveServiceNowConnectionStatus({
      isLoading: false,
      loadError: null,
      isTesting: false,
      nativeEnabled: true,
      credentialsReady: true,
      canConfigureAdmin: false,
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
      canConfigureAdmin: false,
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

  it("collapses incident settings and emphasizes credentials when not configured (TB-1164/TB-1165)", () => {
    const composition = resolveServiceNowPageComposition({
      nativeEnabled: true,
      credentialsReady: false,
      testGateAllowed: false,
    });

    expect(composition.showNotConfiguredNextStep).toBe(true);
    expect(composition.incidentSettingsCollapsed).toBe(true);
    expect(composition.showConnectionTest).toBe(false);
    expect(composition.emphasizedSetupStepId).toBe("credentials");
  });

  it("shows connection test when gate allows", () => {
    const composition = resolveServiceNowPageComposition({
      nativeEnabled: true,
      credentialsReady: true,
      testGateAllowed: true,
    });

    expect(composition.showNotConfiguredNextStep).toBe(false);
    expect(composition.incidentSettingsCollapsed).toBe(false);
    expect(composition.showConnectionTest).toBe(true);
    expect(composition.emphasizedSetupStepId).toBe("verified");
  });
});
