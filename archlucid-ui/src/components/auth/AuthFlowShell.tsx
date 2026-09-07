"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF,
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL,
} from "@/lib/authentication-sign-in-inbound-copy";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";
import {
  productLineAuthWelcomeAriaLabel,
  productLineDisplayName,
  productLineEvaluationSignupLead,
  productLinePasswordlessExplanation,
} from "@/lib/product-line/product-line-display-name";
import { publicSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

export type AuthFlowShellProps = {
  readonly children: ReactNode;
  /** When false, omits evaluation signup footer (e.g. invitation-only context). Defaults to true. */
  readonly showEvaluationSignupLink?: boolean;
  /** When true, shows a post-sign-in return promise above the panel. */
  readonly hasReturnDestination?: boolean;
  /** When false, omits the passwordless footer line (session-expired inlines it above the CTA). */
  readonly showFooterPasswordlessExplanation?: boolean;
  /** When false, omits the footer help link (session-expired raises it beside the CTA). */
  readonly showFooterHelpLink?: boolean;
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
  showFooterPasswordlessExplanation = true,
  showFooterHelpLink = true,
  afterPanel = null,
}: AuthFlowShellProps) {
  const { productLine } = useProductLine();
  const showFooterLinks = showEvaluationSignupLink || showFooterHelpLink;

  return (
    <div className="w-full text-al-text-primary" data-testid="auth-flow-shell">
      <div className="mx-auto flex w-full max-w-[520px] flex-col px-4 sm:px-6">
        <header>
          <ArchLucidWordmarkLink
            href={publicSiteHref("/welcome")}
            aria-label={productLineAuthWelcomeAriaLabel(productLine)}
            wordmarkText={productLineDisplayName(productLine)}
            variant="marketing"
            className="self-start"
          />
        </header>

        {hasReturnDestination ? (
          <p
            className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="auth-flow-return-destination-hint"
          >
            {SIGN_IN_PAGE_COPY.returnDestinationHint}
          </p>
        ) : null}

        <div
          className={cn(
            DESIGN_TOKENS.surface.card,
            hasReturnDestination ? "mt-3 p-4 sm:p-5" : "mt-4 p-4 sm:p-5",
          )}
          data-testid="auth-flow-panel"
        >
          {children}
        </div>

        {afterPanel}

        {showFooterPasswordlessExplanation || showFooterLinks ? (
          <footer className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            {showFooterPasswordlessExplanation ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {productLinePasswordlessExplanation(productLine)}
              </p>
            ) : null}
            {showFooterLinks ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {showEvaluationSignupLink ? (
                  <>
                    {productLineEvaluationSignupLead(productLine)}{" "}
                    <Link className={OPERATOR_LINK.nav} href={publicSiteHref("/signup")}>
                      Start an evaluation
                    </Link>
                    {" · "}
                  </>
                ) : null}
                {showFooterHelpLink ? (
                  <Link className={OPERATOR_LINK.nav} href={AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF}>
                    {AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL}
                  </Link>
                ) : null}
              </p>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
