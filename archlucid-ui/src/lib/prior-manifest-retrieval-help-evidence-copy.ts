import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_CANONICAL_PATH = "/help/prior-manifest-retrieval" as const;

export const PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE =
  "This Prior manifest retrieval guide orients operators on how finalized reviews become searchable tenant memory — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open Search review evidence or Ask when you need live retrieval hits.";

export const PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO =
  "Use these follow-ups when prior-manifest vocabulary turns into live search, Ask answers, or finalized package lineage.";

export type PriorManifestRetrievalHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/prior-manifest-retrieval`. */
export const PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES: readonly PriorManifestRetrievalHelpSourceLink[] = [
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Ask review questions", href: "/insights/ask-review-questions" },
  { label: "Reviews", href: REVIEWS_LIST_PATH },
  { label: "Signed review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;
