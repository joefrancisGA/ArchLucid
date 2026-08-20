import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SPONSOR_SUMMARY_CLAIM_DISCIPLINE =
  "Period preview tiles and sponsor exports summarize finalized reviews and directional ROI for the selected window — not financial reporting or a full audit export. Open Evidence trail or Trust Center before treating this report as procurement evidence.";

export const SPONSOR_SUMMARY_SOURCES_INTRO =
  "Use these follow-ups when the sponsor report needs a fuller evidence trail, ROI methodology, or assurance cites.";


/** Operator Sources — no self-href to the sponsor report path. */
export const SPONSOR_SUMMARY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Evidence trail", href: "/insights/evidence-graph" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "ROI methodology help", href: inAppHelpHref("sponsor-report") },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const SPONSOR_SUMMARY_CANONICAL_PATH = SPONSOR_REPORT_PATH;
