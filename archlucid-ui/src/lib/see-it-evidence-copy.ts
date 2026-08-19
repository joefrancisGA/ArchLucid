import { CANONICAL_ANONYMOUS_PROOF_HREF, SECONDARY_CLAIMS_PROOF_HREF } from "@/lib/showcase-static-demo";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CANONICAL_GET_STARTED_PATH } from "@/lib/legacy-quick-start-route";

export const SEE_IT_CANONICAL_PATH = "/see-it" as const;

export const SEE_IT_SCOPE_DISCLOSURE_BODY =
  "This page shows a fabricated sample finalized review for evaluation — marketing proof orientation, not a sealed-review diligence Sources package from your tenant. Open Assurance status or start an evaluation when you need live workspace evidence.";

/** Legacy claim text — prefer {@link SEE_IT_SCOPE_DISCLOSURE_BODY} in scope disclosure. */
export const SEE_IT_CLAIM_DISCIPLINE = SEE_IT_SCOPE_DISCLOSURE_BODY;

export const SEE_IT_SOURCES_INTRO =
  "Use these evaluation links when the sample proof turns into signup, assurance, or a deeper walkthrough.";


/** Marketing Sources — no self-href to `/see-it`; no Contoso `/demo/preview` (TB-1028 Option A). */
export const SEE_IT_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: CANONICAL_GET_STARTED_PATH },
  { label: "Primary sample showcase", href: CANONICAL_ANONYMOUS_PROOF_HREF },
  { label: "Claims regulated-depth showcase", href: SECONDARY_CLAIMS_PROOF_HREF },
  { label: "Security & Trust", href: "/assurance-status" },
] as const;
