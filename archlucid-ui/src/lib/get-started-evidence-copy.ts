import { GET_STARTED_HELP_GETTING_STARTED_HREF } from "@/app/(marketing)/get-started/get-started-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const GET_STARTED_CANONICAL_PATH = "/get-started" as const;

/** Body for demoted scope disclosure (replaces footer amber orientation callout). */
export const GET_STARTED_SCOPE_DISCLOSURE_BODY =
  "This get-started page orients buyers toward a guided trial or illustrative sample review — it is marketing first-run orientation, not a sealed-review diligence Sources package from your tenant. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const GET_STARTED_SOURCES_INTRO =
  "Use these evaluation links when path selection turns into signup, assurance, or product orientation.";

/** Marketing Sources — no self-href to `/get-started`. */
export const GET_STARTED_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Trust Center", href: "/trust" },
  { label: "Getting started help", href: inAppHelpHref("getting-started") },
] as const;

const GET_STARTED_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  "/signup",
  GET_STARTED_HELP_GETTING_STARTED_HREF,
  inAppHelpHref("getting-started"),
]);

/** Orientation-strip Sources — excludes hero help link and on-page evaluation CTAs. */
export const GET_STARTED_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = GET_STARTED_SOURCES.filter(
  (source) => !GET_STARTED_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
