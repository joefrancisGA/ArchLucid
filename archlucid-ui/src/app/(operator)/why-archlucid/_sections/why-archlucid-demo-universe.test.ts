import { describe, expect, it } from "vitest";

import {
  resolveWhyArchLucidDemoUniverse,
  whyArchLucidChromeMismatchesPayload,
  whyArchLucidSponsorPackSourceLine,
  whyArchLucidUniverseWalkthroughLead,
} from "./why-archlucid-demo-universe";

describe("why-archlucid-demo-universe (TB-1306)", () => {
  it("classifies Contoso Retail seed run ids as contoso", () => {
    expect(
      resolveWhyArchLucidDemoUniverse({
        demoRunId: "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
      }),
    ).toBe("contoso");
  });

  it("classifies Claims showcase run ids as claims", () => {
    expect(
      resolveWhyArchLucidDemoUniverse({
        demoRunId: "claims-intake-modernization",
      }),
    ).toBe("claims");
  });

  it("fails closed to unknown when Claims and Contoso signals collide", () => {
    expect(
      resolveWhyArchLucidDemoUniverse({
        demoRunId: "claims-intake-modernization",
        citationLabels: ["contoso-baseline-v1"],
      }),
    ).toBe("unknown");
  });

  it("treats Claims chrome over Contoso payload as a mismatch", () => {
    expect(whyArchLucidChromeMismatchesPayload("claims", "contoso")).toBe(true);
    expect(whyArchLucidChromeMismatchesPayload("contoso", "contoso")).toBe(false);
  });

  it("never puts Claims Intake copy on Contoso chrome strings", () => {
    const lead = whyArchLucidUniverseWalkthroughLead("contoso");
    const sponsor = whyArchLucidSponsorPackSourceLine("contoso");

    expect(lead.toLowerCase()).toContain("retail baseline");
    expect(lead.toLowerCase()).not.toContain("claims intake");
    expect(sponsor.toLowerCase()).toContain("retail baseline");
    expect(sponsor.toLowerCase()).not.toContain("claims intake");
  });
});
