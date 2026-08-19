"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
} from "@/lib/auth/session-expired-page-copy";
import { publicSiteHref } from "@/lib/site-urls";
import { getSessionMessageCopy } from "@/app/(operator)/auth/signin/session-message-copy";

export type SessionExpiredViewProps = {
  /** Raw `reason` query value; unrecognized or absent values fall back to safe generic copy. */
  readonly reason?: string | null;
  readonly onSignIn: () => void;
  /** Shows the "return to the last page" hint when a real (non-root) return destination is known. */
  readonly hasReturnDestination?: boolean;
  /** Renders a subtle public exit secondary link. Defaults to `true`. */
  readonly showReturnHome?: boolean;
};

/**
 * Shown when the user arrives at sign-in with a recognized `reason` (idle-timeout,
 * session-expired, signed-out, unauthorized). Explains why they were signed out and
 * offers a single primary "Sign in" action, plus an optional low-emphasis way home.
 * Avoids artifact-specific links (reviews, sample review) because those
 * routes require authentication.
 */
export function SessionExpiredView({
  reason,
  onSignIn,
  hasReturnDestination = false,
  showReturnHome = true,
}: SessionExpiredViewProps) {
  const copy = getSessionMessageCopy(reason);

  return (
    <div data-testid="session-expired-view">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)} data-testid="session-expired-heading">
        {copy.title}
      </h1>
      <p className={cn("mt-3 text-[15px] leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {copy.body}
      </p>
      {copy.showsReturnDestinationHint || hasReturnDestination ? (
        <p
          className={cn(
            "mt-3 text-[15px] leading-relaxed text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.body,
            hasReturnDestination ? "font-medium text-al-text-primary" : undefined,
          )}
        >
          {hasReturnDestination
            ? "Sign in to continue where you left off."
            : "Sign in again to continue."}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="primary" onClick={onSignIn} data-testid="session-expired-sign-in">
          Sign in
        </Button>
        {showReturnHome ? (
          <Link
            className={cn(OPERATOR_LINK.nav, "text-sm text-al-text-secondary")}
            href={publicSiteHref(SESSION_EXPIRED_SECONDARY_EXIT_PATH)}
            data-testid="session-expired-return-home"
          >
            {SESSION_EXPIRED_SECONDARY_EXIT_LABEL}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
