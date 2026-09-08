import { describe, expect, it } from "vitest";

import { riskExceptionRenewHasUnsavedEdits } from "@/lib/risk-exception-renew-unsaved";
import { teamsIntegrationHasUnsavedEdits } from "@/lib/teams-integration-form-unsaved";
import type { TeamsIncomingWebhookConnectionResponse } from "@/types/teams-incoming-webhook-connection";

describe("teamsIntegrationHasUnsavedEdits", () => {
  it("returns false for a saved configured connection with unchanged fields", () => {
    const conn: TeamsIncomingWebhookConnectionResponse = {
      isConfigured: true,
      keyVaultSecretName: "teams-secret",
      label: "Governance alerts",
      enabledTriggers: ["governance.approval.submitted"],
    };

    expect(
      teamsIntegrationHasUnsavedEdits(
        conn,
        ["governance.approval.submitted"],
        "teams-secret",
        "Governance alerts",
        new Set(["governance.approval.submitted"]),
      ),
    ).toBe(false);
  });

  it("returns true when a configured connection label changes", () => {
    const conn: TeamsIncomingWebhookConnectionResponse = {
      isConfigured: true,
      keyVaultSecretName: "teams-secret",
      label: "Governance alerts",
      enabledTriggers: ["governance.approval.submitted"],
    };

    expect(
      teamsIntegrationHasUnsavedEdits(
        conn,
        ["governance.approval.submitted"],
        "teams-secret",
        "Changed label",
        new Set(["governance.approval.submitted"]),
      ),
    ).toBe(true);
  });
});

describe("riskExceptionRenewHasUnsavedEdits", () => {
  it("returns false when renew form is closed", () => {
    expect(riskExceptionRenewHasUnsavedEdits(null, "2026-12-01T00:00:00.000Z", "", "2026-12-01T00:00:00.000Z")).toBe(
      false,
    );
  });

  it("returns true when renew rationale has typed text", () => {
    expect(
      riskExceptionRenewHasUnsavedEdits(
        "risk-1",
        "2026-12-01T00:00:00.000Z",
        "Pilot extension",
        "2026-12-01T00:00:00.000Z",
      ),
    ).toBe(true);
  });
});
