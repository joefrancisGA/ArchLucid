export const AUTH_CALLBACK_CLAIM_DISCIPLINE =
  "The OAuth callback completes sign-in token exchange — it is an authentication handoff, not a signed-review diligence Sources package. After you reach a workspace, open Assurance status or a finalized review when you need live evidence.";

export const AUTH_CALLBACK_SOURCES_INTRO =
  "Use these follow-ups when the callback fails or you need evaluation orientation before a workspace is ready.";

export type AuthCallbackSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Public Sources — no self-href to /auth/callback. */
export const AUTH_CALLBACK_SOURCES: readonly AuthCallbackSourceLink[] = [
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Authentication help", href: "/help/authentication-sign-in" },
] as const;
