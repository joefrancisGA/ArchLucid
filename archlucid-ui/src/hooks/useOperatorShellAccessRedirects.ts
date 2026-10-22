"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { operatorPrincipalLacksArchLucidAccess } from "@/lib/access-denied-context";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import { pathnameExemptFromOperatorAccessGate } from "@/lib/operator/operator-shell-access-gate";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

/**
 * Client-side operator access redirects (unsigned JWT → sign-in, missing role → `/403`).
 * Must run while deferred access-gate chrome is visible — `OperatorRoleGate` is not mounted then (TB-730 / TB-796),
 * and while full shell chrome is visible before `AppShellMainContentGateDeferred` hydrates (TB-2118).
 */
export function useOperatorShellAccessRedirects(): void {
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
      const returnPath =
        typeof window !== "undefined" ? `${pathname}${window.location.search}` : pathname;

      router.replace(buildAuthSignInHref({ returnPath }));

      return;
    }

    if (!lacksArchLucidAccess) {
      return;
    }

    router.replace("/403");
  }, [currentPrincipal, isAuthorityLoading, jwtSignedIn, lacksArchLucidAccess, pathname, router]);
}
