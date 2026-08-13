"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  isSponsorOnlyPrincipal,
  resolveSponsorRedirectTarget,
} from "@/lib/sponsor-sponsor-shell-redirect";

export type SponsorShellRedirectProps = {
  readonly children: ReactNode;
};

/**
 * Redirects Sponsor-only principals out of operator chrome into the sponsor reviews shell.
 * Execute+ roles that also carry Sponsor stay in operator workflows.
 */
export function SponsorShellRedirect(props: SponsorShellRedirectProps): React.JSX.Element {
  const { children } = props;
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();

  useEffect(() => {
    if (isAuthorityLoading) {
      return;
    }

    if (currentPrincipal.provenance !== "auth-me") {
      return;
    }

    if (!isSponsorOnlyPrincipal(currentPrincipal.roleClaimValues)) {
      return;
    }

    const target = resolveSponsorRedirectTarget({
      pathname,
      search: searchParams.toString().length > 0 ? `?${searchParams.toString()}` : "",
    });

    if (target === null || target === pathname) {
      return;
    }

    router.replace(target);
  }, [currentPrincipal, isAuthorityLoading, pathname, router, searchParams]);

  return <>{children}</>;
}
