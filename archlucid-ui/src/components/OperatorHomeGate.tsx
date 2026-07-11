"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OperatorShellAccessGateLoading } from "@/components/OperatorShellAccessGateLoading";
import { AUTH_MODE } from "@/lib/auth-config";
import { operatorHomeGateAllowsInitialPaint } from "@/lib/operator-shell-access-gate";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

/**
 * When OIDC JWT mode is enabled and the browser has no session, the operator home (`/`)
 * redirects buyers to the public marketing welcome page.
 */
export function OperatorHomeGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allow, setAllow] = useState(operatorHomeGateAllowsInitialPaint);

  useEffect(() => {
    if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
      setAllow(true);

      return;
    }

    if (!isLikelySignedIn()) {
      router.replace("/welcome");

      return;
    }

    setAllow(true);
  }, [router]);

  if (!allow) {
    return <OperatorShellAccessGateLoading />;
  }

  return <>{children}</>;
}
