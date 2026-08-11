import { describe, expect, it } from "vitest";

import {
  TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE,
  TRUST_ASSURANCE_SECURITY_TRUST_HEADING,
  TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK,
  TRUST_ASSURANCE_SECURITY_TRUST_WHY_THREE,
  buildTrustAssuranceSecurityTrustVocabulary,
  resolveTrustAssuranceSecurityTrustPeerLinks,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import {
  ASSURANCE_STATUS_PUBLIC_PATH,
  TRUST_CENTER_PUBLIC_PATH,
} from "@/lib/marketing-assurance-public-labels";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

describe("trust-assurance-security-trust-vocabulary (TB-2302)", () => {
  it("explains Trust Center vs Assurance status vs Security & trust hub", () => {
    const model = buildTrustAssuranceSecurityTrustVocabulary();

    expect(model.heading).toBe(TRUST_ASSURANCE_SECURITY_TRUST_HEADING);
    expect(model.whyThree).toBe(TRUST_ASSURANCE_SECURITY_TRUST_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("public");
    expect(model.whyThree.toLowerCase()).toContain("operator");
    expect(model.compactLine).toBe(TRUST_ASSURANCE_SECURITY_TRUST_COMPACT_LINE);
    expect(model.trustCenterLink.href).toBe(TRUST_CENTER_PUBLIC_PATH);
    expect(model.assuranceStatusLink.href).toBe(ASSURANCE_STATUS_PUBLIC_PATH);
    expect(model.securityTrustHubLink.href).toBe(SETTINGS_SECURITY_TRUST_PATH);
  });

  it("resolves peers excluding the current surface", () => {
    expect(resolveTrustAssuranceSecurityTrustPeerLinks("trust-center")).toEqual([
      TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
      TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK,
    ]);

    expect(resolveTrustAssuranceSecurityTrustPeerLinks("assurance-status")).toEqual([
      TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
      TRUST_ASSURANCE_SECURITY_TRUST_HUB_LINK,
    ]);

    expect(resolveTrustAssuranceSecurityTrustPeerLinks("security-trust-hub")).toEqual([
      TRUST_ASSURANCE_SECURITY_TRUST_CENTER_LINK,
      TRUST_ASSURANCE_SECURITY_TRUST_ASSURANCE_LINK,
    ]);
  });
});
