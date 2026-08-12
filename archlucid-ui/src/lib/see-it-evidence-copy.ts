import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { LIVE_DEMO_PAGE_TITLE } from "@/lib/live-demo-page-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SEE_IT_CANONICAL_PATH = "/see-it" as const;

export const SEE_IT_CLAIM_DISCIPLINE =
  "This see-it page shows a fabricated sample finalized review for evaluation — it is marketing proof orientation, not a signed-review diligence Sources package from your tenant. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const SEE_IT_SOURCES_INTRO =
  "Use these evaluation links when the sample proof turns into signup, assurance, or a deeper walkthrough.";


/** Marketing Sources — no self-href to `/see-it`; no Contoso `/demo/preview` (TB-1028 Option A). */
export const SEE_IT_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: LIVE_DEMO_PAGE_TITLE, href: "/live-demo" },
  { label: "Claims showcase", href: CANONICAL_ANONYMOUS_PROOF_HREF },
  { label: "Security & Trust", href: "/security-trust" },
] as const;
