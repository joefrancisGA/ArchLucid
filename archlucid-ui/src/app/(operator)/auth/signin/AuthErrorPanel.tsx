"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AuthErrorPanelProps = {
  readonly message: string;
  readonly title?: string;
  /** When set, retries sign-in in place instead of linking to `/auth/signin`. */
  readonly onTryAgain?: () => void;
  readonly tryAgainHref?: string;
};

/** Shared "sign-in cannot proceed" panel — used by the sign-in, session-expired, and callback pages. */
export function AuthErrorPanel({
  message,
  title = "Access request",
  onTryAgain,
  tryAgainHref = "/auth/signin",
}: AuthErrorPanelProps) {
  return (
    <div className="max-w-[560px]" data-testid="auth-error-panel">
      <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{title}</h2>
      <p className={cn("mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{message}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {onTryAgain ? (
          <Button variant="primary" size="sm" onClick={onTryAgain} data-testid="auth-error-try-again">
            Try again
          </Button>
        ) : (
          <Button asChild variant="primary" size="sm" data-testid="auth-error-try-again">
            <Link href={tryAgainHref}>Try again</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/help">Help</Link>
        </Button>
      </div>
    </div>
  );
}
