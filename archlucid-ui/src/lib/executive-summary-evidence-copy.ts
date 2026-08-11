import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const EXECUTIVE_SUMMARY_CLAIM_DISCIPLINE =
  "Period preview tiles and sponsor exports summarize finalized reviews and directional ROI for the selected window — they are not a signed-review diligence Sources package by themselves. Open Evidence trail or Trust Center before treating this report as procurement evidence.";

export const EXECUTIVE_SUMMARY_SOURCES_INTRO =
  "Use these follow-ups when the executive summary needs a fuller evidence trail, ROI methodology, or assurance cites.";


/** Operator Sources — no self-href to the executive summary path. */
export const EXECUTIVE_SUMMARY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "ROI methodology help", href: inAppHelpHref("executive-summary") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const EXECUTIVE_SUMMARY_CANONICAL_PATH = SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH;
