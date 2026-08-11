import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SCOPE_HELP_CANONICAL_PATH = "/help/scope" as const;

export const SCOPE_HELP_CLAIM_DISCIPLINE =
  "This workspace and scope guide explains tenant, workspace, and project boundaries for architects — it is orientation vocabulary, not a signed-review diligence Sources package. Open Users and roles or Data handling when you need access or isolation depth.";

export const SCOPE_HELP_SOURCES_INTRO =
  "Use these follow-ups when scope vocabulary turns into access control, isolation, or first-run setup.";


/** Operator Sources — no self-href to `/help/scope`. */
export const SCOPE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Users settings", href: "/administration/users" },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
