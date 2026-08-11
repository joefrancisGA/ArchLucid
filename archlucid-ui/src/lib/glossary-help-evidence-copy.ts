import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GLOSSARY_HELP_CANONICAL_PATH = "/help/glossary" as const;

export const GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD =
  "This glossary defines product terms for architects and buyers — it is orientation vocabulary, not a signed-review diligence Sources package.";

export const GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL =
  "when you need live workflow or assurance trails.";

/** Inline follow-ups named in claim discipline — not a mid-page Sources block (TB-2092). */
export const GLOSSARY_HELP_FOLLOW_UP_LINKS: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Audit", href: "/governance/audit" },
] as const;

/** Plain-text guard for tests that do not render links. */
export const GLOSSARY_HELP_CLAIM_DISCIPLINE = `${GLOSSARY_HELP_CLAIM_DISCIPLINE_LEAD} Open Getting started, Assurance status, or Audit ${GLOSSARY_HELP_CLAIM_DISCIPLINE_TAIL}`;
