import { describe, expect, it } from "vitest";

import {
  resolveSecureNowGovernanceFindingsClaimDiscipline,
  resolveSecureNowGovernanceFindingsEmptyStateCopy,
  resolveSecureNowGovernanceFindingsPageSubtitle,
  resolveSecureNowGovernanceFindingsPageTitle,
  SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE,
} from "@/lib/product-line/securenow-governance-findings-copy";
import { resolveLayerGuidanceForProductLine } from "@/lib/layer-guidance";
import { resolvePageCapabilityBoundary } from "@/lib/page-capability-boundary";

describe("securenow governance findings copy", () => {
  it("uses SecureNow findings header copy without architecture-review language", () => {
    const corpus = [
      resolveSecureNowGovernanceFindingsPageTitle(),
      resolveSecureNowGovernanceFindingsPageSubtitle(),
      resolveSecureNowGovernanceFindingsClaimDiscipline(),
      resolveSecureNowGovernanceFindingsEmptyStateCopy().title,
      resolveSecureNowGovernanceFindingsEmptyStateCopy().description,
      SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE.headline,
      SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE.useWhen,
      SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE.enterpriseFootnote ?? "",
    ].join("\n").toLowerCase();

    expect(resolveSecureNowGovernanceFindingsPageTitle()).toBe("Findings");
    expect(corpus).toContain("cloud");
    expect(corpus).toContain("policy pack");
    expect(corpus).not.toContain("architecture review");
    expect(corpus).not.toContain("sealed review");
    expect(corpus).not.toContain("practice");
  });

  it("resolves SecureNow layer guidance and capability boundary for governance findings", () => {
    expect(resolveLayerGuidanceForProductLine("governance-findings", "security")).toEqual(
      SECURENOW_GOVERNANCE_FINDINGS_LAYER_GUIDANCE,
    );
    expect(resolvePageCapabilityBoundary("governanceFindings", "security").items.join(" ")).toContain(
      "audit evidence lineage",
    );
  });
});
