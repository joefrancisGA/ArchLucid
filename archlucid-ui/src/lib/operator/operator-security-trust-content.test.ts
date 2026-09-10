import { describe, expect, it } from "vitest";

import {
  operatorSecurityTrustMaterialItems,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_ROADMAP,
  OPERATOR_SECURITY_TRUST_MATURITY_TAG_UNDER_NDA,
  resolveOperatorSecurityTrustMaterialAvailability,
  resolveOperatorSecurityTrustMaterialReviewedLabel,
} from "@/lib/operator/operator-security-trust-content";
import { assuranceMaturityBadgeLabel } from "@/lib/security-trust-content";
import { operatorSecurityTrustSubprocessorsWhatItIs } from "@/lib/security-trust-product-copy";

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
    const hrefs = operatorSecurityTrustMaterialItems("architecture").map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.some((href) => href.includes("/trust"))).toBe(false);
  });

  it("clarifies SecureNow delivery in subprocessors copy on the security shell", () => {
    const securitySubprocessors = operatorSecurityTrustMaterialItems("security").find(
      (item) => item.docSlug === "subprocessors",
    );

    expect(securitySubprocessors?.whatItIs).toBe(operatorSecurityTrustSubprocessorsWhatItIs("security"));
    expect(securitySubprocessors?.whatItIs).toContain("ArchLucid SaaS");
    expect(securitySubprocessors?.whatItIs).toContain("SecureNow");
  });
});
