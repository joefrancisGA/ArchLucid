import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

export type KpiTileDrillThroughLinkProps = {
  readonly href: string;
  readonly testId: string;
  readonly children: ReactNode;
  readonly className?: string;
};

/** Wraps a KPI count so the tile stays card-like without default link underline (TB-244). */
export function KpiTileDrillThroughLink(props: KpiTileDrillThroughLinkProps) {
  const { href, testId, children, className } = props;

  return (
    <Link
      href={href}
      data-testid={testId}
      className={cn(
        "block rounded-sm text-inherit no-underline outline-none transition-shadow",
        "cursor-pointer hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {children}
    </Link>
  );
}
