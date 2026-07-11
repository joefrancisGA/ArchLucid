"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { OperatorShellAccessGateLoading } from "@/components/OperatorShellAccessGateLoading";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { operatorPrincipalLacksArchLucidAccess } from "@/lib/access-denied-context";
import {
  pathnameExemptFromOperatorAccessGate,
  shouldDeferOperatorShellChrome,
} from "@/lib/operator-shell-access-gate";
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
  const router = useRouter();
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const jwtSignedIn = isJwtAuthMode() && isLikelySignedIn();
  const lacksArchLucidAccess = operatorPrincipalLacksArchLucidAccess(currentPrincipal, { jwtSignedIn });

  useEffect(() => {
    if (pathnameExemptFromOperatorAccessGate(pathname)) {
      return;
    }

    if (isAuthorityLoading) {
      return;
    }

    if (isJwtAuthMode() && !isLikelySignedIn()) {
      router.replace("/welcome");

      return;
    }

    if (!lacksArchLucidAccess) {
      return;
    }

    router.replace("/403");
  }, [currentPrincipal, isAuthorityLoading, jwtSignedIn, lacksArchLucidAccess, pathname, router]);

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
