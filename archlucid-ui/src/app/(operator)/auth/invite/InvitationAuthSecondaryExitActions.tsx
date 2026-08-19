"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { clearInvitationToken } from "@/lib/auth/email-otp-session";
import {
  AUTH_INVITE_HELP_LABEL,
  AUTH_INVITE_HELP_PATH,
  AUTH_INVITE_PUBLIC_EXIT_LABEL,
  AUTH_INVITE_PUBLIC_EXIT_PATH,
  AUTH_INVITE_SIGN_IN_AGAIN_LABEL,
  AUTH_INVITE_SIGN_IN_AGAIN_PATH,
  AUTH_INVITE_USE_DIFFERENT_ACCOUNT_LABEL,
} from "@/lib/auth/invitation-auth-secondary-exit-copy";
import { clearOidcSession, signOutAndRedirectHome } from "@/lib/oidc/session";
import { publicSiteHref } from "@/lib/site-urls";

export type InvitationAuthSecondaryExitActionsProps = {
  /** When false, omits Sign in again — invalid recovery already exposes sign-in (TB-1474). */
  readonly showSignInAgain?: boolean;
};

function redirectToSignInAgain(): void {
  clearOidcSession();
  window.location.assign(AUTH_INVITE_SIGN_IN_AGAIN_PATH);
}

function useDifferentAccount(): void {
  clearInvitationToken();
  void signOutAndRedirectHome();
}

/** Safe secondary exits on `/auth/invite` when stuck (TB-1476; pairs TB-1469 / TB-1315). */
export function InvitationAuthSecondaryExitActions({
  showSignInAgain = true,
}: InvitationAuthSecondaryExitActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3" data-testid="invitation-secondary-exit">
      {showSignInAgain ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="invitation-secondary-sign-in-again"
          onClick={redirectToSignInAgain}
        >
          {AUTH_INVITE_SIGN_IN_AGAIN_LABEL}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="invitation-secondary-use-different-account"
        onClick={useDifferentAccount}
      >
        {AUTH_INVITE_USE_DIFFERENT_ACCOUNT_LABEL}
      </Button>

      <Link
        className={OPERATOR_LINK.nav}
        href={AUTH_INVITE_HELP_PATH}
        data-testid="invitation-secondary-help"
      >
        {AUTH_INVITE_HELP_LABEL}
      </Link>

      <Link
        className={OPERATOR_LINK.nav}
        href={publicSiteHref(AUTH_INVITE_PUBLIC_EXIT_PATH)}
        data-testid="invitation-secondary-public-exit"
      >
        {AUTH_INVITE_PUBLIC_EXIT_LABEL}
      </Link>
    </div>
  );
}
