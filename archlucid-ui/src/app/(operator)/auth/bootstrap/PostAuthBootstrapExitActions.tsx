"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import {
  POST_AUTH_BOOTSTRAP_SIGN_IN_AGAIN_LABEL,
  POST_AUTH_BOOTSTRAP_SIGN_IN_PATH,
  POST_AUTH_BOOTSTRAP_USE_DIFFERENT_ACCOUNT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
} from "@/lib/auth/post-auth-bootstrap-exit-copy";
import { clearOidcSession, signOutAndRedirectHome } from "@/lib/oidc/session";
import { publicSiteHref } from "@/lib/site-urls";

function redirectToSignInAgain(): void {
  clearOidcSession();
  window.location.assign(POST_AUTH_BOOTSTRAP_SIGN_IN_PATH);
}

/** Secondary exits when post-auth bootstrap cannot complete (TB-1469; pairs TB-1315). */
export function PostAuthBootstrapExitActions() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3" data-testid="bootstrap-secondary-exit">
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="bootstrap-sign-in-again"
        onClick={redirectToSignInAgain}
      >
        {POST_AUTH_BOOTSTRAP_SIGN_IN_AGAIN_LABEL}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="bootstrap-use-different-account"
        onClick={() => {
          void signOutAndRedirectHome();
        }}
      >
        {POST_AUTH_BOOTSTRAP_USE_DIFFERENT_ACCOUNT_LABEL}
      </Button>
      <Link
        className={OPERATOR_LINK.nav}
        href={publicSiteHref(SESSION_EXPIRED_SECONDARY_EXIT_PATH)}
        data-testid="bootstrap-public-exit"
      >
        {SESSION_EXPIRED_SECONDARY_EXIT_LABEL}
      </Link>
    </div>
  );
}
