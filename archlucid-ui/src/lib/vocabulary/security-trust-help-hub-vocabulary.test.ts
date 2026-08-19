import { describe, expect, it } from "vitest";

import {
  SECURITY_TRUST_HELP_HUB_COMPACT_LINE,
  SECURITY_TRUST_HELP_HUB_HEADING,
  SECURITY_TRUST_HELP_HUB_HELP_LINK,
  SECURITY_TRUST_HELP_HUB_HUB_LINK,
  SECURITY_TRUST_HELP_HUB_WHY_TWO,
  buildSecurityTrustHelpHubVocabulary,
  resolveSecurityTrustHelpHubPeerLink,
} from "@/lib/vocabulary/security-trust-help-hub-vocabulary";
import { SECURITY_TRUST_HELP_CANONICAL_PATH } from "@/lib/security-trust-help-evidence-copy";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";

describe("security-trust-help-hub-vocabulary (TB-2315)", () => {
  it("explains help-topic orientation vs admin security-trust hub", () => {
    const model = buildSecurityTrustHelpHubVocabulary();

    expect(model.heading).toBe(SECURITY_TRUST_HELP_HUB_HEADING);
    expect(model.whyTwo).toBe(SECURITY_TRUST_HELP_HUB_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("help");
    expect(model.whyTwo.toLowerCase()).toContain("hub");
    expect(model.compactLine).toBe(SECURITY_TRUST_HELP_HUB_COMPACT_LINE);

    expect(model.securityTrustHelpLink).toEqual(SECURITY_TRUST_HELP_HUB_HELP_LINK);
    expect(model.securityTrustHelpLink.href).toBe(SECURITY_TRUST_HELP_CANONICAL_PATH);
    expect(model.securityTrustHubLink).toEqual(SECURITY_TRUST_HELP_HUB_HUB_LINK);
    expect(model.securityTrustHubLink.href).toBe(SETTINGS_SECURITY_TRUST_PATH);
  });

  it("resolves the peer surface from security-trust-help and security-trust-hub", () => {
    expect(resolveSecurityTrustHelpHubPeerLink("security-trust-help")).toEqual(
      SECURITY_TRUST_HELP_HUB_HUB_LINK,
    );

    expect(resolveSecurityTrustHelpHubPeerLink("security-trust-hub")).toEqual(
      SECURITY_TRUST_HELP_HUB_HELP_LINK,
    );
  });
});
