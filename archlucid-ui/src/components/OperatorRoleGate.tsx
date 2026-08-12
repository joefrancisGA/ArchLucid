"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { OperatorShellAccessGateLoading } from "@/components/OperatorShellAccessGateLoading";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { useOperatorShellAccessRedirects } from "@/hooks/useOperatorShellAccessRedirects";
import { operatorPrincipalLacksArchLucidAccess } from "@/lib/access-denied-context";
import {
  pathnameExemptFromOperatorAccessGate,
  shouldDeferOperatorShellChrome,
} from "@/lib/operator/operator-shell-access-gate";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

type OperatorRoleGateProps = {
  children: ReactNode;
};

/**
 * Redirects authenticated principals without a recognized ArchLucid app role to `/403`.
 * API policies remain authoritative; this prevents unprivileged shell access after `/me` hydration.
 */
export function OperatorRoleGate({ children }: OperatorRoleGateProps) {
  const pathname = usePathname();
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const jwtSignedIn = isJwtAuthMode() && isLikelySignedIn();
  const lacksArchLucidAccess = operatorPrincipalLacksArchLucidAccess(currentPrincipal, { jwtSignedIn });

  useOperatorShellAccessRedirects();

  if (pathnameExemptFromOperatorAccessGate(pathname)) {
    return <>{children}</>;
  }

  if (shouldDeferOperatorShellChrome(pathname, isAuthorityLoading)) {
    return <OperatorShellAccessGateLoading />;
  }

  if (isJwtAuthMode() && !isLikelySignedIn()) {
    return <OperatorShellAccessGateLoading />;
  }

  if (!isAuthorityLoading && lacksArchLucidAccess && (isJwtAuthMode() ? isLikelySignedIn() : true)) {
    return null;
  }

  return <>{children}</>;
}
