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
    <div className="w-full text-al-text-primary" data-testid="auth-flow-shell">
      <div className="mx-auto flex w-full max-w-[520px] flex-col px-4 sm:px-6">
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
          className={cn(
            DESIGN_TOKENS.surface.card,
            hasReturnDestination ? "mt-4 p-6 sm:p-7" : "mt-6 p-6 sm:p-7",
          )}
          data-testid="auth-flow-panel"
        >
          {children}
        </div>

        {afterPanel}

        <footer className="mt-6 space-y-2 border-t border-neutral-200 pt-5 dark:border-neutral-800">
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
