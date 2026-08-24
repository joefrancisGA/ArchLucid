"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SESSION_EXPIRED_PASSWORDLESS_EXPLANATION,
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
  SESSION_EXPIRED_SIGN_OUT_DISCLOSURE_LABEL,
} from "@/lib/auth/session-expired-page-copy";
import {
  formatSessionExpiredReturnHint,
  resolveReturnDestinationLabel,
} from "@/lib/auth/sign-in-return-destination";
import {
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF,
  AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL,
} from "@/lib/authentication-sign-in-inbound-copy";
import { appSiteHref } from "@/lib/site-urls";
import { getSessionMessageCopy } from "@/app/(operator)/auth/signin/session-message-copy";

export type SessionExpiredViewProps = {
  /** Raw `reason` query value; unrecognized or absent values fall back to safe generic copy. */
  readonly reason?: string | null;
  readonly onSignIn: () => void;
  /** Safe `returnUrl` query value when the user was mid-session. */
  readonly returnUrl?: string;
  /** ISO timestamp from idle-timeout handoff — shown in disclosure when present. */
  readonly sessionClearedAt?: string | null;
  /** Renders a subtle public exit secondary link. Defaults to `true`. */
  readonly showReturnHome?: boolean;
};

function formatSessionClearedAt(isoTimestamp: string): string | null {
  const parsed = new Date(isoTimestamp);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
  returnUrl,
  sessionClearedAt,
  showReturnHome = true,
}: SessionExpiredViewProps) {
  const copy = getSessionMessageCopy(reason);
  const returnDestinationLabel = resolveReturnDestinationLabel(returnUrl);
  const formattedClearedAt =
    reason === "idle-timeout" && sessionClearedAt !== undefined && sessionClearedAt !== null
      ? formatSessionClearedAt(sessionClearedAt)
      : null;

  return (
    <div data-testid="session-expired-view">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)} data-testid="session-expired-heading">
        {copy.title}
      </h1>
      <p className={cn("mt-3 text-[15px] leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {copy.body}
      </p>
      {copy.workPreservationNote === undefined ? null : (
        <p className={cn("mt-3 text-[15px] leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {copy.workPreservationNote}
        </p>
      )}
      {copy.scopeNote === undefined ? null : (
        <p className={cn("mt-3 text-[15px] leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {copy.scopeNote}
        </p>
      )}
      {formattedClearedAt === null ? null : (
        <details className="mt-3" data-testid="session-expired-sign-out-disclosure">
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {SESSION_EXPIRED_SIGN_OUT_DISCLOSURE_LABEL}
          </summary>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{formattedClearedAt}</p>
        </details>
      )}
      <p className={cn("mt-4 text-[15px] leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {SESSION_EXPIRED_PASSWORDLESS_EXPLANATION}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="primary" onClick={onSignIn} data-testid="session-expired-sign-in">
          Sign in
        </Button>
        {showReturnHome ? (
          <Link
            className={cn(OPERATOR_LINK.nav, "text-sm text-al-text-secondary")}
            href={appSiteHref(SESSION_EXPIRED_SECONDARY_EXIT_PATH)}
            data-testid="session-expired-return-home"
          >
            {SESSION_EXPIRED_SECONDARY_EXIT_LABEL}
          </Link>
        ) : null}
        <Link
          className={cn(OPERATOR_LINK.nav, "text-sm")}
          href={AUTHENTICATION_SIGN_IN_INBOUND_HELP_HREF}
          data-testid="session-expired-auth-help"
        >
          {AUTHENTICATION_SIGN_IN_INBOUND_HELP_LINK_LABEL}
        </Link>
        {returnDestinationLabel !== null && copy.showsReturnDestinationHint ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="session-expired-return-destination-hint"
          >
            {formatSessionExpiredReturnHint(returnDestinationLabel)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
