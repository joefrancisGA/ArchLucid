import { describe, expect, it } from "vitest";

import {
  assuranceStatusHeroSupporting,
  operatorSecurityTrustNdaRequestHref,
  operatorSecurityTrustSubprocessorsWhatItIs,
  securityTrustEvidenceSources,
} from "@/lib/security-trust-product-copy";

describe("security-trust-product-copy", () => {
  it("names SecureNow in the security assurance hero", () => {
    expect(assuranceStatusHeroSupporting("security")).toContain("SecureNow's current assurance posture");
    expect(assuranceStatusHeroSupporting("security")).not.toContain("ArchLucid's current assurance");
  });

  it("names ArchLucid in the architecture assurance hero", () => {
    expect(assuranceStatusHeroSupporting("architecture")).toContain("ArchLucid's current assurance posture");
  });

  it("keeps ArchLucid as the hosted SaaS legal entity for security subprocessors copy", () => {
    expect(operatorSecurityTrustSubprocessorsWhatItIs("security")).toContain("hosted ArchLucid SaaS");
    expect(operatorSecurityTrustSubprocessorsWhatItIs("security")).toContain("SecureNow");
  });

  it("uses SecureNow in the NDA mailto subject on the security shell only", () => {
    expect(operatorSecurityTrustNdaRequestHref("security")).toBe(
      "mailto:security@archlucid.net?subject=SecureNow%20security%20review",
    );
    expect(operatorSecurityTrustNdaRequestHref("architecture")).toContain("ArchLucid%20security%20review");
    expect(operatorSecurityTrustNdaRequestHref("security")).toContain("security@archlucid.net");
  });

  it("localizes how-it-works source label by product line", () => {
    const securitySources = securityTrustEvidenceSources("security");
    const architectureSources = securityTrustEvidenceSources("architecture");

    expect(securitySources.find((link) => link.href.includes("how-archlucid-works"))?.label).toBe(
      "How SecureNow works",
    );
    expect(architectureSources.find((link) => link.href.includes("how-archlucid-works"))?.label).toBe(
      "How ArchLucid works",
    );
  });
});
