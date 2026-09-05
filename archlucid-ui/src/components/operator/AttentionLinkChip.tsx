import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { cn } from "@/lib/utils";

export type AttentionLinkChipProps = {
  readonly children: ReactNode;
  readonly href: string;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
  readonly "data-testid"?: string;
};

/** Link-styled attention chip — navigation affordance, not read-only metadata styling. */
export function AttentionLinkChip(props: AttentionLinkChipProps): ReactElement {
  return (
    <Link
      href={props.href}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium leading-tight no-underline transition-colors",
        buyerFilterChipClass(false, false),
        props.className,
      )}
      aria-label={props["aria-label"]}
      aria-current={props["aria-current"]}
      data-testid={props["data-testid"]}
    >
      {props.children}
    </Link>
  );
}
