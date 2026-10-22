import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";
import {
  localizeEvidenceSourceLinks,
  resolveSecureNowEvidenceHref,
  securityTrustEvidenceSourcesForProductLine,
} from "@/lib/product-line/securenow-evidence-navigation";

describe("securenow-evidence-navigation", () => {
  it("rewrites marketing hrefs for the security product line", () => {
    expect(resolveSecureNowEvidenceHref("security", "/trust")).toBe(SETTINGS_SECURITY_TRUST_PATH);
    expect(resolveSecureNowEvidenceHref("security", "/faq")).toBe(inAppHelpHref("procurement"));
    expect(resolveSecureNowEvidenceHref("security", "/pricing")).toBe(inAppHelpHref("billing-and-plans"));
    expect(resolveSecureNowEvidenceHref("security", "/privacy")).toBe(inAppHelpHref("data-handling"));
    expect(resolveSecureNowEvidenceHref("security", "/get-started")).toBe(inAppHelpHref("getting-started"));
    expect(resolveSecureNowEvidenceHref("security", "/why-archlucid")).toBe(inAppHelpHref("getting-started"));
  });

  it("leaves operator paths unchanged for the security product line", () => {
    expect(resolveSecureNowEvidenceHref("security", "/governance/findings")).toBe("/governance/findings");
  });

  it("does not rewrite marketing hrefs for the architecture product line", () => {
    expect(resolveSecureNowEvidenceHref("architecture", "/trust")).toBe("/trust");
    expect(resolveSecureNowEvidenceHref("architecture", "/faq")).toBe("/faq");
  });

  it("localizes evidence source link arrays", () => {
    const links = localizeEvidenceSourceLinks("security", [
      { label: "Trust Center", href: "/trust" },
      { label: "FAQ", href: "/faq" },
    ]);

    expect(links[0]?.href).toBe(SETTINGS_SECURITY_TRUST_PATH);
    expect(links[1]?.href).toBe(inAppHelpHref("procurement"));
  });

  it("returns operator assurance sources for security trust evidence", () => {
    const sources = securityTrustEvidenceSourcesForProductLine("security");

    expect(sources.some((source) => source.href === "/trust")).toBe(false);
    expect(sources.some((source) => source.href === SETTINGS_SECURITY_TRUST_PATH)).toBe(true);
  });
});
