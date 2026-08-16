import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EXAMPLE_ROI_BULLETIN_CANONICAL_PATH = "/example-roi-bulletin" as const;

export const EXAMPLE_ROI_BULLETIN_SCOPE_DISCLOSURE_BODY =
  "Synthetic aggregate ROI bulletin Markdown for evaluation orientation — not a signed publication, live tenant ROI, or SQL-sourced aggregate. Real numbers require operator admin preview after at least five qualifying tenants.";

export const EXAMPLE_ROI_BULLETIN_CLAIM_DISCIPLINE = EXAMPLE_ROI_BULLETIN_SCOPE_DISCLOSURE_BODY;

export const EXAMPLE_ROI_BULLETIN_SOURCES_INTRO =
  "Use these evaluation links when the synthetic bulletin shape turns into methodology help, sponsor ROI, assurance, or signup.";


export const EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF = inAppHelpHref(
  "sponsor-report",
  "pilot-roi-measurement",
);

/** Marketing Sources - no self-href to `/example-roi-bulletin`. */
export const EXAMPLE_ROI_BULLETIN_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pilot ROI measurement (help)", href: EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF },
  { label: "Sponsor report", href: "/insights/sponsor-report" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
] as const;
