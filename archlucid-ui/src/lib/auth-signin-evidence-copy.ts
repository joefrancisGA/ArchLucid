import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeEvidenceSourceLinks } from "@/lib/product-line/securenow-evidence-navigation";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUTH_SIGNIN_FOLLOW_UPS_TITLE = "Where to go next";

export const AUTH_SIGNIN_CLAIM_DISCIPLINE =
  "Sign-in is authentication only — not a full audit export. After you enter a workspace, open Assurance status or a finalized review when you need live evidence.";

export const AUTH_SIGNIN_SOURCES_INTRO =
  "Use these follow-ups when sign-in is blocked or you need product orientation before a workspace is ready.";


const AUTH_SIGNIN_SOURCES_ARCHITECTURE: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
] as const;

/** Public Sources — no self-href to /auth/signin. */
export const AUTH_SIGNIN_SOURCES: readonly EvidenceSourceLink[] = AUTH_SIGNIN_SOURCES_ARCHITECTURE;

export function authSignInSourcesForProductLine(productLineId: ProductLineId): readonly EvidenceSourceLink[] {
  if (productLineId === "security") {
    return localizeEvidenceSourceLinks(productLineId, [
      { label: "Getting started", href: inAppHelpHref("getting-started") },
      { label: "Assurance status", href: "/assurance-status" },
      { label: "Procurement FAQ", href: "/faq" },
      { label: "Data handling", href: "/privacy" },
    ]);
  }

  return localizeEvidenceSourceLinks(productLineId, AUTH_SIGNIN_SOURCES_ARCHITECTURE);
}
