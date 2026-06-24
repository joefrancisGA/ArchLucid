"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export type SessionExpiredViewProps = {
  readonly onSignIn: () => void;
};

/**
 * Shown when the user arrives at sign-in with `reason=idle-timeout`.
 * Explains the session expiry and offers a single explicit "Sign in" action.
 * Avoids artifact-specific links (review packages, sample review) because those
 * routes require authentication.
 */
export function SessionExpiredView({ onSignIn }: SessionExpiredViewProps) {
  return (
    <div className="max-w-[560px]">
      <h2
        className="mt-0 text-xl font-semibold text-neutral-900 dark:text-neutral-100"
        data-testid="session-expired-heading"
      >
        Your session expired
      </h2>
      <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
        You were signed out after a period of inactivity. Sign in again to continue where you left off.
      </p>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        If you were working on a review, your draft may still be available after signing in.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="default" size="sm" onClick={onSignIn} data-testid="session-expired-sign-in">
          Sign in
        </Button>
        <Link href="/" className="text-sm text-teal-800 underline dark:text-teal-300">
          {OPERATOR_NAV_LINK_LABELS.home}
        </Link>
      </div>
    </div>
  );
}
