"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getSessionMessageCopy } from "@/app/(operator)/auth/signin/session-message-copy";

export type SessionExpiredViewProps = {
  /** Raw `reason` query value; unrecognized or absent values fall back to safe generic copy. */
  readonly reason?: string | null;
  readonly onSignIn: () => void;
  /** Shows the "return to the last page" hint when a real (non-root) return destination is known. */
  readonly hasReturnDestination?: boolean;
  /** Renders a subtle "Return to home" secondary link. Defaults to `true`. */
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
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)} data-testid="session-expired-heading">
        {copy.title}
      </h2>
      <p className={cn("mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{copy.body}</p>
      {copy.showsReturnDestinationHint ? (
        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {hasReturnDestination
            ? "Sign in again to continue. If you were working on a review, ArchLucid will try to return you to the last page you visited."
            : "Sign in again to continue."}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" onClick={onSignIn} data-testid="session-expired-sign-in">
          Sign in
        </Button>
        {showReturnHome ? (
          <Link className={OPERATOR_LINK.nav} href="/" data-testid="session-expired-return-home">
            Return to home
          </Link>
        ) : null}
      </div>
    </div>
  );
}
