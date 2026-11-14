import { describe, expect, it } from "vitest";

import { SECURENOW_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveGettingStartedHelpHostedSaasOpenAiCopy } from "@/lib/getting-started-help-guide-content";
import { reportProblemSurfacesForPathname } from "@/lib/report-problem-surfaces";
import { SECURENOW_HOSTED_SAAS_OPENAI_COPY } from "@/lib/score-lift-round40-hosted-saas-openai-copy";
import { SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/product-line/securenow-second-capture-delta-copy";
import { SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE } from "@/lib/product-line/securenow-synthetic-fixture-discipline";
import { SECURENOW_PATH_INSPECT_RANK_STORED_PATH_DISCIPLINE } from "@/lib/product-line/securenow-path-inspect-copy";
import { resolveDecisionRegisterEmptyCompact } from "@/lib/enterprise-compact-empty-state-presets-governance";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { remapGovernanceOperatorHref } from "@/lib/product-line/securenow-compliance-routes";
import { ATTACK_PATH_REPORT_DIAGRAM_FILTER_EMPTY } from "@/app/(operator)/governance/remediation-factory/resolve-attack-path-report-snapshot-id";

describe("score-lift round 40 product-line contracts", () => {
  it("registers SecureNow compliance hub report-problem surfaces", () => {
    expect(
      reportProblemSurfacesForPathname(SECURENOW_POLICY_PACKS_PATH).some(
        (surface) => surface.id === "compliance-policy-packs-hub-hard-failure",
      ),
    ).toBe(true);
    expect(
      reportProblemSurfacesForPathname("/compliance/standards-and-rules").some(
        (surface) => surface.id === "compliance-standards-rules-hard-failure",
      ),
    ).toBe(true);
  });

  it("keeps round-40 honesty copy modules stable", () => {
    expect(SECURENOW_SYNTHETIC_FIXTURE_DISCIPLINE).toContain("Synthetic fixture");
    expect(SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE).toContain("second successful capture");
    expect(SECURENOW_PATH_INSPECT_RANK_STORED_PATH_DISCIPLINE).toContain("stored path snapshot");
    expect(ATTACK_PATH_REPORT_DIAGRAM_FILTER_EMPTY).toContain("empty diagram");
    expect(resolveGettingStartedHelpHostedSaasOpenAiCopy("security")).toBe(SECURENOW_HOSTED_SAAS_OPENAI_COPY);
  });

  it("remaps decision-register approval CTA on SecureNow", () => {
    const compact = resolveDecisionRegisterEmptyCompact("security");
    const approvalAction = compact.actions?.find((action) => action.label === "Open resolve outcomes");

    expect(approvalAction?.href).toBe(remapGovernanceOperatorHref(GOVERNANCE_APPROVAL_QUEUE_PATH, "security"));
  });
});
