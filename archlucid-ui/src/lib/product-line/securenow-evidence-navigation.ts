import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";
import { howProductWorksHelpSourceLink } from "@/lib/help/help-product-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

const SECURENOW_OPERATOR_ASSURANCE_PATH = SETTINGS_SECURITY_TRUST_PATH;

/** Rewrites marketing-only hrefs to operator/help destinations when the Security shell is active. */
export function resolveSecureNowEvidenceHref(productLineId: ProductLineId, href: string): string {
  if (productLineId !== "security") {
    return href;
  }

  switch (href) {
    case "/trust":
    case "/assurance-status":
      return SECURENOW_OPERATOR_ASSURANCE_PATH;
    case "/faq":
      return inAppHelpHref("procurement");
    case "/pricing":
      return inAppHelpHref("billing-and-plans");
    case "/privacy":
      return inAppHelpHref("data-handling");
    case "/get-started":
      return inAppHelpHref("getting-started");
    case "/why":
    case "/why-archlucid":
      return inAppHelpHref("getting-started");
    case "/welcome":
      return "/";
    default:
      return href;
  }
}

export function localizeEvidenceSourceLinks(
  productLineId: ProductLineId,
  links: readonly EvidenceSourceLink[],
): readonly EvidenceSourceLink[] {
  return links.map((link) => ({
    ...link,
    href: resolveSecureNowEvidenceHref(productLineId, link.href),
  }));
}

/** Security-shell diligence follow-ups — no marketing routes. */
export function secureNowSecurityTrustEvidenceSources(productLineId: ProductLineId): readonly EvidenceSourceLink[] {
  return [
    { label: "Assurance status", href: SECURENOW_OPERATOR_ASSURANCE_PATH },
    { label: "Security and trust help", href: inAppHelpHref("security-trust") },
    { label: "Data handling and isolation", href: inAppHelpHref("data-handling") },
    { label: "Subprocessors", href: inAppHelpHref("subprocessors") },
    howProductWorksHelpSourceLink(productLineId),
  ];
}

export function securityTrustEvidenceSourcesForProductLine(
  productLineId: ProductLineId,
): readonly EvidenceSourceLink[] {
  if (productLineId === "security") {
    return secureNowSecurityTrustEvidenceSources(productLineId);
  }

  return [
    { label: "Trust Center", href: "/trust" },
    { label: "Product FAQ", href: "/faq" },
    { label: "Pricing", href: "/pricing" },
    { label: "Privacy policy", href: "/privacy" },
    howProductWorksHelpSourceLink(productLineId),
  ];
}
