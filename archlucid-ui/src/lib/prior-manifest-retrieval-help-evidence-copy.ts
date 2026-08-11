import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH = "/help/prior-manifest-retrieval" as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE =
  "This Prior manifest retrieval guide orients architects on how finalized reviews become searchable tenant memory — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Search review evidence or Ask when you need live retrieval hits.";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO =
  "Use these follow-ups when prior-manifest vocabulary turns into live search, Ask answers, or finalized package lineage.";


/** Operator Sources — no self-href to `/help/prior-manifest-retrieval`. */
export const PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Ask review questions", href: "/insights/ask-review-questions" },
  { label: "Reviews", href: REVIEWS_LIST_PATH },
  { label: "Signed review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;
