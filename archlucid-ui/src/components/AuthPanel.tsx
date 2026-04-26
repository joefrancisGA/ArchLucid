"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import {
  isLikelySignedIn,
  readSignedInDisplayName,
  signOutAndRedirectHome,
} from "@/lib/oidc/session";

/** Shell header strip: dev bypass notice, or OIDC sign-in / sign-out + display name. */
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

  if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
    return (
      <div
        role="region"
        aria-label="Authentication status"
        className="mb-4 rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <strong>Auth mode:</strong> Development bypass (API auto-authenticates; no UI sign-in). Set{" "}
        <code className="text-[13px] text-neutral-800 dark:text-neutral-200">
          NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt
        </code>{" "}
        and OIDC env vars for Entra / OIDC.
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Authentication status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
    >
      <div>
        <strong>Auth:</strong> OIDC (JWT bearer to API via <code>/api/proxy</code>)
        {signedIn && displayName ? (
          <>
            {" "}
            — signed in as <strong>{displayName}</strong>
          </>
        ) : signedIn ? (
          <> — signed in</>
        ) : (
          <> — not signed in</>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {!signedIn ? (
          <Link
            className="auth-panel-focus rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white no-underline dark:bg-slate-800"
            href="/auth/signin"
            aria-label="Sign in with your organization account"
          >
            Sign in
          </Link>
        ) : (
          <button
            type="button"
            className="auth-panel-focus rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            aria-label="Sign out and return to the operator home page"
            onClick={() => void signOutAndRedirectHome()}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
