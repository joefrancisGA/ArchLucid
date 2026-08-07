export const AUTH_BOOTSTRAP_CANONICAL_PATH = "/auth/bootstrap" as const;

export const AUTH_BOOTSTRAP_CLAIM_DISCIPLINE =
  "This post-sign-in bootstrap chooses or creates a workspace - it is an authentication handoff, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. After you enter a workspace, open Assurance status or a finalized review when you need live workspace evidence.";

export const AUTH_BOOTSTRAP_SOURCES_INTRO =
  "Use these follow-ups when bootstrap is blocked or you need product orientation before a workspace is ready.";

export type AuthBootstrapSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Public/product Sources - no self-href to `/auth/bootstrap`. */
export const AUTH_BOOTSTRAP_SOURCES: readonly AuthBootstrapSourceLink[] = [
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
