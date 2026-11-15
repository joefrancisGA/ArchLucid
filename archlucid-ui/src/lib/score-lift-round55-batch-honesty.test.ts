import { describe, expect, it } from "vitest";

import {
  DECLARED_CONNECTION_ROW_EXPIRY_HONESTY_LINE,
  shouldShowDeclaredConnectionRowExpiryHonesty,
} from "@/lib/governance/declared-connections-row-expiry-honesty-copy";
import {
  formatInfraEvidenceAskStaleSnapshotCitationLine,
  shouldShowInfraEvidenceAskStaleSnapshotCitation,
} from "@/lib/infra-evidence/infra-evidence-ask-stale-snapshot-citation-copy";
import { WORKSPACE_HEALTH_KPI_CARD_AS_OF_LINE } from "@/lib/insights/workspace-health-kpi-card-as-of-copy";
import { formatGuidedIntakeScopeLimitsAgentsHelper } from "@/lib/guided-intake-scope-limits-agents-copy";
import { POLICY_PACKS_WORKSPACE_ASSIGNMENTS_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/policy/policy-packs-workspace-status-copy";
import { formatSecureNowInvestigationEffortBlockingBanner } from "@/lib/product-line/securenow-investigation-effort-blocking-banner-copy";

describe("score-lift round55 batch honesty", () => {
  it("declared row expiry, workspace kpi as-of, policy pack empty", () => {
    expect(shouldShowDeclaredConnectionRowExpiryHonesty("2026-12-01T00:00:00.000Z")).toBe(true);
    expect(DECLARED_CONNECTION_ROW_EXPIRY_HONESTY_LINE).toContain("UTC");
    expect(WORKSPACE_HEALTH_KPI_CARD_AS_OF_LINE).toContain("Point-in-time");
    expect(POLICY_PACKS_WORKSPACE_ASSIGNMENTS_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not the same");
  });

  it("investigation blocking banner and guided intake scope", () => {
    expect(formatSecureNowInvestigationEffortBlockingBanner("Still needed: Baseline hours (B).")).toContain(
      "ROI blocked",
    );
    expect(formatGuidedIntakeScopeLimitsAgentsHelper({ focusedPilotModeEnabled: true, isCreateArchitectureFlow: false })).toContain(
      "Focused pilot",
    );
  });

  it("Ask stale snapshot citation", () => {
    expect(shouldShowInfraEvidenceAskStaleSnapshotCitation("snap-a", "snap-b")).toBe(true);
    expect(shouldShowInfraEvidenceAskStaleSnapshotCitation("snap-a", "snap-a")).toBe(false);
    expect(formatInfraEvidenceAskStaleSnapshotCitationLine("snap-a")).toContain("snap-a");
  });
});