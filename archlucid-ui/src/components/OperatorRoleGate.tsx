"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (pathname === "/403" || pathname.startsWith("/auth/")) {
      return;
    }

    if (isAuthorityLoading) {
      return;
    }

    if (isJwtAuthMode() && !isLikelySignedIn()) {
      return;
    }

    if (currentPrincipal.provenance !== "auth-me") {
      return;
    }

    if (currentPrincipal.hasRecognizedArchLucidRole) {
      return;
    }

    router.replace("/403");
  }, [currentPrincipal, isAuthorityLoading, pathname, router]);

  if (pathname === "/403") {
    return <>{children}</>;
  }

  if (
    !isAuthorityLoading
    && currentPrincipal.provenance === "auth-me"
    && !currentPrincipal.hasRecognizedArchLucidRole
    && (isJwtAuthMode() ? isLikelySignedIn() : true)
  ) {
    return null;
  }

  return <>{children}</>;
}

/** Static unauthorized page for principals missing ArchLucid app roles. */
export function OperatorUnauthorizedPageClient() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center" data-testid="operator-unauthorized-page">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Access not authorized</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Your identity signed in successfully, but no ArchLucid app role (Admin, Operator, Reader, or Auditor) was found on
        your token. Ask your tenant administrator to assign an app role in your identity provider, then sign in again.
      </p>
      <Button asChild variant="outline">
        <Link href="/auth/sign-in">Return to sign-in</Link>
      </Button>
    </div>
  );
}
