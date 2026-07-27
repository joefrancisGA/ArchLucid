import type { ReactNode } from "react";
import Link from "next/link";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AuthFlowShellProps = {
  readonly children: ReactNode;
  /** When false, omits evaluation signup footer (e.g. invitation-only context). Defaults to true. */
  readonly showEvaluationSignupLink?: boolean;
};

/**
 * Branded full-page shell for passwordless sign-in (Architect plan, email-code users,
 * and anyone whose organization has not configured SSO). Keeps touch targets and
 * side padding usable on narrow phones without changing step internals.
 */
export function AuthFlowShell({ children, showEvaluationSignupLink = true }: AuthFlowShellProps) {
  return (
    <div
      className="min-h-[100dvh] bg-al-surface-base text-al-text-primary"
      data-testid="auth-flow-shell"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col justify-center px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <ArchLucidWordmarkLink
            href="/welcome"
            aria-label="ArchLucid — welcome"
            variant="marketing"
            className="self-start"
          />
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Architecture review workspace
          </p>
        </header>

        <div
          className={cn(DESIGN_TOKENS.surface.card, "mt-6 p-5 sm:p-6")}
          data-testid="auth-flow-panel"
        >
          {children}
        </div>

        <footer className="mt-4 space-y-2">
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            ArchLucid does not use a product password. Sign in with a work or school account or a
            one-time email code.
          </p>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {showEvaluationSignupLink ? (
              <>
                New to ArchLucid?{" "}
                <Link className={OPERATOR_LINK.nav} href="/signup">
                  Start an evaluation
                </Link>
                {" · "}
              </>
            ) : null}
            <Link className={OPERATOR_LINK.nav} href="/help/authentication-sign-in">
              Authentication help
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
