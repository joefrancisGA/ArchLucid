import type { ReactNode } from "react";
import Link from "next/link";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF,
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL,
} from "@/lib/authentication-sign-in-inbound-copy";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";
import { publicSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

export type AuthFlowShellProps = {
  readonly children: ReactNode;
  /** When false, omits evaluation signup footer (e.g. invitation-only context). Defaults to true. */
  readonly showEvaluationSignupLink?: boolean;
  /** When true, shows a post-sign-in return promise above the panel. */
  readonly hasReturnDestination?: boolean;
  /** Optional Evidence orientation strip below the auth panel (ASI/ACB). */
  readonly afterPanel?: ReactNode;
};

/**
 * Branded full-page shell for passwordless sign-in (Architect plan, email-code users,
 * and anyone whose organization has not configured SSO). Keeps touch targets and
 * side padding usable on narrow phones without changing step internals.
 */
export function AuthFlowShell({
  children,
  showEvaluationSignupLink = true,
  hasReturnDestination = false,
  afterPanel = null,
}: AuthFlowShellProps) {
  return (
    <div
      className="min-h-[100dvh] bg-al-surface-base text-al-text-primary"
      data-testid="auth-flow-shell"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col justify-center px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <ArchLucidWordmarkLink
            href={publicSiteHref("/welcome")}
            aria-label="ArchLucid — welcome"
            variant="marketing"
            className="self-start"
          />
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Architecture review workspace
          </p>
        </header>

        {hasReturnDestination ? (
          <p
            className={cn("mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="auth-flow-return-destination-hint"
          >
            {SIGN_IN_PAGE_COPY.returnDestinationHint}
          </p>
        ) : null}

        <div
          className={cn(DESIGN_TOKENS.surface.card, hasReturnDestination ? "mt-4 p-5 sm:p-6" : "mt-6 p-5 sm:p-6")}
          data-testid="auth-flow-panel"
        >
          {children}
        </div>

        {afterPanel}

        <footer className="mt-4 space-y-2">
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            ArchLucid does not use a product password. Sign in with a work or school account or a
            one-time email code.
          </p>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {showEvaluationSignupLink ? (
              <>
                New to ArchLucid?{" "}
                <Link className={OPERATOR_LINK.nav} href={publicSiteHref("/signup")}>
                  Start an evaluation
                </Link>
                {" · "}
              </>
            ) : null}
            <Link className={OPERATOR_LINK.nav} href={AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF}>
              {AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL}
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
