import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const GET_STARTED_CANONICAL_PATH = "/get-started" as const;

export const GET_STARTED_CLAIM_DISCIPLINE =
  "This get-started page orients buyers toward a guided trial or illustrative sample review — it is marketing first-run orientation, not a signed-review diligence Sources package from your tenant. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const GET_STARTED_SOURCES_INTRO =
  "Use these evaluation links when path selection turns into signup, assurance, or product orientation.";


/** Marketing Sources — no self-href to `/get-started`. */
export const GET_STARTED_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Getting started help", href: inAppHelpHref("getting-started") },
] as const;
