"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OperatorShellAccessGateLoading } from "@/components/operator/OperatorShellAccessGateLoading";
import { OperatorShellSignInRequired } from "@/components/operator/OperatorShellSignInRequired";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useOperatorShellAccessRedirects } from "@/hooks/useOperatorShellAccessRedirects";
import { operatorPrincipalLacksArchLucidAccess } from "@/lib/access-denied-context";
import {
  operatorShellAccessGateLoadingTitle,
  pathnameExemptFromOperatorAccessGate,
  shouldDeferOperatorShellChrome,
} from "@/lib/operator/operator-shell-access-gate";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

const UNSIGNED_JWT_SIGN_IN_GRACE_MS = 3_000;

type OperatorRoleGateProps = {
  children: ReactNode;
};

function OperatorShellUnsignedJwtGate({ title }: { readonly title?: string }): React.JSX.Element {
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setGraceElapsed(true), UNSIGNED_JWT_SIGN_IN_GRACE_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!graceElapsed) {
    return <OperatorShellAccessGateLoading title={title} />;
  }

  return <OperatorShellSignInRequired />;
}

/**
 * Redirects authenticated principals without a recognized ArchLucid app role to `/403`.
 * API policies remain authoritative; this prevents unprivileged shell access after `/me` hydration.
 */
export function OperatorRoleGate({ children }: OperatorRoleGateProps) {
  const pathname = usePathname();
  const loadingTitle = operatorShellAccessGateLoadingTitle(pathname);
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const jwtSignedIn = isJwtAuthMode() && isLikelySignedIn();
  const lacksArchLucidAccess = operatorPrincipalLacksArchLucidAccess(currentPrincipal, { jwtSignedIn });

  useOperatorShellAccessRedirects();

  if (pathnameExemptFromOperatorAccessGate(pathname)) {
    return <>{children}</>;
  }

  if (isJwtAuthMode() && !isLikelySignedIn()) {
    return <OperatorShellUnsignedJwtGate title={loadingTitle} />;
  }

  if (shouldDeferOperatorShellChrome(pathname, isAuthorityLoading)) {
    return <OperatorShellAccessGateLoading title={loadingTitle} />;
  }

  if (!isAuthorityLoading && lacksArchLucidAccess && (isJwtAuthMode() ? isLikelySignedIn() : true)) {
    return null;
  }

  return <>{children}</>;
}
