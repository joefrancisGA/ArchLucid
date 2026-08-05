import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const QUICK_SCAN_CANONICAL_PATH = "/quick-scan" as const;

export const QUICK_SCAN_CLAIM_DISCIPLINE =
  "Quick Scan is a limited marketing demonstration — results are not saved as workspace reviews, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or start an evaluation when you need live workspace evidence.";

export const QUICK_SCAN_SOURCES_INTRO =
  "Use these evaluation links when a demonstration result turns into signup, assurance, or product orientation.";

export type QuickScanSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/quick-scan`. */
export const QUICK_SCAN_SOURCES: readonly QuickScanSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Data handling help", href: inAppHelpHref("data-handling") },
] as const;
