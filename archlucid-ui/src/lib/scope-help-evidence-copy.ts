import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SCOPE_HELP_CANONICAL_PATH = "/help/scope" as const;

export const SCOPE_HELP_CLAIM_DISCIPLINE =
  "This workspace and scope guide explains tenant, workspace, and project boundaries for operators — it is orientation vocabulary, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Users and roles or Data handling when you need access or isolation depth.";

export const SCOPE_HELP_SOURCES_INTRO =
  "Use these follow-ups when scope vocabulary turns into access control, isolation, or first-run setup.";

export type ScopeHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/scope`. */
export const SCOPE_HELP_SOURCES: readonly ScopeHelpSourceLink[] = [
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Users settings", href: "/administration/users" },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling-tenant-isolation") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
