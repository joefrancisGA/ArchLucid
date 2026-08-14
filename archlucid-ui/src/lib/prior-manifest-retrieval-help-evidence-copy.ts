import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES,
  priorManifestRetrievalHelpRelatedGuides,
} from "@/lib/prior-manifest-retrieval-help-related-guides";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH = "/help/prior-manifest-retrieval" as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL =
  "How Ask memory from finalized reviews works" as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE =
  "This Ask memory guide orients architects on how finalized reviews become searchable tenant memory — it is help orientation, not a sealed-review diligence Sources package from your tenant. Open Search review evidence or Ask when you need live retrieval hits.";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO =
  "Use these follow-ups when Ask-memory vocabulary turns into live search, Ask answers, or finalized package lineage.";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED = priorManifestRetrievalHelpRelatedGuides();

export const PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_HEADING = "Related help" as const;

/** Operator Sources — no self-href to `/help/prior-manifest-retrieval`. */
export const PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Ask review questions", href: "/insights/ask-review-questions" },
  { label: "Reviews", href: REVIEWS_LIST_PATH },
  { label: "Sealed review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;

export { PRIOR_MANIFEST_RETRIEVAL_HELP_RELATED_GUIDES };
