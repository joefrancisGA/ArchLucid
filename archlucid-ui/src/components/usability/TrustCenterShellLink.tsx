import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

type TrustCenterShellLinkProps = {
  readonly className?: string;
  readonly variant?: "header" | "footer";
};

/** In-app link to security and trust documentation — reachable mid-workflow without leaving operator shell context. */
export function TrustCenterShellLink(props: TrustCenterShellLinkProps): React.JSX.Element {
  const variant = props.variant ?? "header";

  return (
    <Link
      href="/trust"
      className={cn(
        variant === "header"
          ? cn(
              OPERATOR_TYPOGRAPHY.helper,
              "inline-flex h-8 items-center rounded-md px-2 font-medium text-al-text-secondary no-underline hover:bg-neutral-100 hover:text-al-text-primary dark:hover:bg-neutral-800",
            )
          : cn(OPERATOR_TYPOGRAPHY.helper, "font-medium text-al-accent-interactive underline underline-offset-2"),
        props.className,
      )}
      data-testid="trust-center-shell-link"
    >
      {OPERATOR_NAV_LINK_LABELS.securityTrust}
    </Link>
  );
}
