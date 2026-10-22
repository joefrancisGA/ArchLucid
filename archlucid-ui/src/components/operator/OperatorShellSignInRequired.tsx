"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import { cn } from "@/lib/utils";

/**
 * Explicit sign-in affordance when JWT mode has no browser session — replaces endless access-gate skeleton.
 */
export function OperatorShellSignInRequired(): React.JSX.Element {
  const pathname = usePathname();
  const returnPath =
    typeof window !== "undefined" ? `${pathname ?? "/"}${window.location.search}` : pathname ?? "/";
  const signInHref = buildAuthSignInHref({ returnPath });

  return (
    <div
      data-testid="operator-shell-sign-in-required"
      className="flex min-h-[50vh] flex-1 flex-col items-start justify-center gap-4 px-4 py-8"
      role="status"
    >
      <h1 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
        Sign in required
      </h1>
      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Sign in to open this workspace. Your return path is preserved after authentication.
      </p>
      <Link href={signInHref} className={OPERATOR_LINK.nav} data-testid="operator-shell-sign-in-link">
        Sign in
      </Link>
    </div>
  );
}
