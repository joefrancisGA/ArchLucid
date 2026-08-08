import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ACCESSIBILITY_CANONICAL_PATH = "/accessibility" as const;

export const ACCESSIBILITY_CLAIM_DISCIPLINE =
  "This accessibility statement describes our public WCAG target, testing posture, and how to report barriers — it is not a signed-review diligence Sources package, or a completed VPAT download. Open Assurance status or Trust Center when you need evaluation assurance materials.";

export const ACCESSIBILITY_SOURCES_INTRO =
  "Use these evaluation links when accessibility questions turn into assurance, trust, or pilot-scope follow-ups.";

export type AccessibilitySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to /accessibility. */
export const ACCESSIBILITY_SOURCES: readonly AccessibilitySourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  { label: "Start evaluation", href: "/signup" },
] as const;
