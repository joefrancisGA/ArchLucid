"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PERSONA_SHELL_SIGN_OUT_HOME_ARIA_LABEL } from "@/lib/vocabulary/persona-shell-vocabulary";
import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import {
  isLikelySignedIn,
  readSignedInDisplayName,
  signOutAndRedirectHome,
} from "@/lib/oidc/session";

/** Inline shell chrome (top bar): OIDC sign-in / sign-out + display name. */
export function AuthPanel() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const refresh = useCallback(() => {
    if (!isJwtAuthMode()) {
      return;
    }

    setSignedIn(isLikelySignedIn());
    setDisplayName(readSignedInDisplayName());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = (): void => {
      refresh();
    };

    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // Sample workspace state lives on ScopeSwitcher — no separate dev top-bar badge.
  if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Authentication status"
      className={cn("flex shrink-0 flex-wrap items-center gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
    >
      <BooleanStatusChip
        value={signedIn}
        trueLabel={signedIn && displayName ? displayName : "Signed in"}
        falseLabel="Not signed in"
        falseIsAttention={false}
        className="h-6 px-2 py-0 font-medium"
      />
      {!signedIn ? (
        <Link
          className={cn("auth-panel-focus inline-flex h-6 items-center rounded-md bg-slate-900 px-2.5 py-0 font-medium text-white no-underline dark:bg-slate-800", OPERATOR_TYPOGRAPHY.helper)}
          href="/auth/signin"
          aria-label="Sign in with your organization account"
        >
          Sign in
        </Link>
      ) : (
        <button
          type="button"
          className={cn("auth-panel-focus inline-flex h-6 items-center rounded-md border border-neutral-300 bg-white px-2 py-0 font-medium text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
          aria-label={PERSONA_SHELL_SIGN_OUT_HOME_ARIA_LABEL}
          onClick={() => void signOutAndRedirectHome()}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
