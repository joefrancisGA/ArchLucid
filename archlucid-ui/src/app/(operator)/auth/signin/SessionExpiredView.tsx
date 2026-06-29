"use client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)} data-testid="session-expired-heading">
        Your session expired
      </h2>
      <p className={cn("mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        You were signed out after a period of inactivity. Sign in again to continue where you left off.
      </p>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        If you were working on a review, your draft may still be available after signing in.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="default" size="sm" onClick={onSignIn} data-testid="session-expired-sign-in">
          Sign in
        </Button>
      </div>
    </div>
  );
}
