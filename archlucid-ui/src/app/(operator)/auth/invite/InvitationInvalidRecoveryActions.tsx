"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import {
  AUTH_INVITE_HELP_LABEL,
  AUTH_INVITE_HELP_PATH,
  AUTH_INVITE_PUBLIC_EXIT_LABEL,
  AUTH_INVITE_PUBLIC_EXIT_PATH,
  AUTH_INVITE_REQUEST_ACCESS_LABEL,
  AUTH_INVITE_REQUEST_ACCESS_PATH,
  AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_LABEL,
  AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH,
  AUTH_INVITE_VALIDATION_RETRY_LABEL,
  type InvitationRecoveryContext,
} from "@/lib/auth/invitation-invalid-recovery-copy";
import { publicSiteHref } from "@/lib/site-urls";

export type InvitationInvalidRecoveryActionsProps = {
  readonly context: InvitationRecoveryContext;
  readonly onRetry?: () => void;
};

/** Recovery exits when invitation validation fails (TB-1474; pairs TB-1469 / TB-1315). */
export function InvitationInvalidRecoveryActions({
  context,
  onRetry,
}: InvitationInvalidRecoveryActionsProps) {
  const requestAccessPrimary = context === "expired";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3" data-testid="invitation-invalid-recovery">
      {context === "validation-failed" && onRetry ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="invitation-recovery-retry"
          onClick={onRetry}
        >
          {AUTH_INVITE_VALIDATION_RETRY_LABEL}
        </Button>
      ) : null}

      {requestAccessPrimary ? (
        <Button asChild variant="primary" size="sm" data-testid="invitation-recovery-request-access">
          <Link href={AUTH_INVITE_REQUEST_ACCESS_PATH}>{AUTH_INVITE_REQUEST_ACCESS_LABEL}</Link>
        </Button>
      ) : (
        <Button asChild variant="primary" size="sm" data-testid="invitation-recovery-sign-in">
          <Link href={AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH}>
            {AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_LABEL}
          </Link>
        </Button>
      )}

      {requestAccessPrimary ? (
        <Button asChild variant="outline" size="sm" data-testid="invitation-recovery-sign-in">
          <Link href={AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH}>
            {AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_LABEL}
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm" data-testid="invitation-recovery-request-access">
          <Link href={AUTH_INVITE_REQUEST_ACCESS_PATH}>{AUTH_INVITE_REQUEST_ACCESS_LABEL}</Link>
        </Button>
      )}

      <Link
        className={OPERATOR_LINK.nav}
        href={publicSiteHref(AUTH_INVITE_PUBLIC_EXIT_PATH)}
        data-testid="invitation-recovery-public-exit"
      >
        {AUTH_INVITE_PUBLIC_EXIT_LABEL}
      </Link>

      <Link
        className={OPERATOR_LINK.nav}
        href={AUTH_INVITE_HELP_PATH}
        data-testid="invitation-recovery-help"
      >
        {AUTH_INVITE_HELP_LABEL}
      </Link>
    </div>
  );
}
