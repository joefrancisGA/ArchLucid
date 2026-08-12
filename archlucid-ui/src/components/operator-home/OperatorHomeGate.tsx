"use client";

import { useEffect, useState, type ReactNode } from "react";

import { OperatorShellAccessGateLoading } from "@/components/operator/OperatorShellAccessGateLoading";
import { AUTH_MODE } from "@/lib/auth-config";
import { operatorHomeGateAllowsInitialPaint } from "@/lib/operator/operator-shell-access-gate";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { publicSiteHref } from "@/lib/site-urls";

/**
 * When OIDC JWT mode is enabled and the browser has no session, the operator home (`/`)
 * redirects buyers to the public marketing welcome page.
 *
 * Uses `window.location.replace` so an unsigned visit never starts a soft App Router transition
 * that can wedge later client navigations from Overview.
 */
export function OperatorHomeGate({ children }: { children: ReactNode }) {
  const [allow, setAllow] = useState(operatorHomeGateAllowsInitialPaint);

  useEffect(() => {
    if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
      setAllow(true);

      return;
    }

    if (!isLikelySignedIn()) {
      window.location.replace(publicSiteHref("/welcome"));

      return;
    }

    setAllow(true);
  }, []);

  if (!allow) {
    return <OperatorShellAccessGateLoading />;
  }

  return <>{children}</>;
}
