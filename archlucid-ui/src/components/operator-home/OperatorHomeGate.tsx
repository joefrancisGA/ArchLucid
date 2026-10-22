"use client";

import { useEffect, useState, type ReactNode } from "react";

import { OperatorShellAccessGateLoading } from "@/components/operator/OperatorShellAccessGateLoading";
import { AUTH_MODE } from "@/lib/auth-config";
import { operatorHomeGateAllowsInitialPaint } from "@/lib/operator/operator-shell-access-gate";
import { isJwtAuthMode } from "@/lib/oidc/config";

/**
 * Defers operator home paint until client auth state is known. Unsigned JWT visitors stay on
 * the app host; `useOperatorShellAccessRedirects` sends them to `/auth/signin` instead of
 * the marketing welcome page.
 */
export function OperatorHomeGate({ children }: { children: ReactNode }) {
  const [allow, setAllow] = useState(operatorHomeGateAllowsInitialPaint);

  useEffect(() => {
    if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
      setAllow(true);

      return;
    }

    setAllow(true);
  }, []);

  if (!allow) {
    return <OperatorShellAccessGateLoading />;
  }

  return <>{children}</>;
}
