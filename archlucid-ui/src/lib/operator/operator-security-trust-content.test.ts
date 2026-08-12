import { describe, expect, it } from "vitest";

import {
  OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  resolveOperatorSecurityTrustMaterialAvailability,
  resolveOperatorSecurityTrustMaterialReviewedLabel,
} from "@/lib/operator/operator-security-trust-content";
import { assuranceMaturityBadgeLabel } from "@/lib/security-trust-content";

describe("operator-security-trust-content", () => {
  it("sources reviewed dates from PRODUCT_DOCUMENTATION_REGISTRY without inventing values", () => {
    expect(resolveOperatorSecurityTrustMaterialReviewedLabel("subprocessors")).toBe("2026-07-25");
    expect(resolveOperatorSecurityTrustMaterialReviewedLabel("soc2-self-assessment")).toBe("2026-05-26");
    expect(resolveOperatorSecurityTrustMaterialReviewedLabel("dpa-template")).toBe("Not recorded");
    expect(resolveOperatorSecurityTrustMaterialReviewedLabel("caiq-sig-response")).toBe("Not recorded");
  });

  it("describes availability from registry pdfStatus without overstating public download", () => {
    expect(resolveOperatorSecurityTrustMaterialAvailability("dpa-template")).toBe(
      "In-product help topic; PDF publicly available",
    );
    expect(resolveOperatorSecurityTrustMaterialAvailability("caiq-sig-response")).toBe(
      "In-product help topic; PDF publicly available",
    );
  });

  it("aligns NDA and roadmap badge labels with assuranceMaturityBadgeLabel", () => {
    expect(OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA.label).toBe(
      assuranceMaturityBadgeLabel("during_diligence"),
    );
    expect(OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP.label).toBe(assuranceMaturityBadgeLabel("planned_next"));
    expect(OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA.kind).toBe("in-progress");
    expect(OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP.kind).toBe("draft");
  });

  it("keeps unique hrefs across material inventory rows", () => {
    const hrefs = OPERATOR_SECURITY_TRUST_MATERIAL_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.some((href) => href.includes("/trust"))).toBe(false);
  });
});
